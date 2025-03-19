import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Sentence,
  CharacterMapping,
} from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SpeechService } from '../../services/speech.service';
import {
  Subject,
  takeUntil,
  combineLatest,
  map,
  distinctUntilChanged,
  filter,
} from 'rxjs';
import { AudioControlsComponent } from '../audio-controls/audio-controls.component';
import { PlaybackState } from '../audio-controls/playback-state.enum';

@Component({
  selector: 'app-sentence',
  standalone: true,
  imports: [CommonModule, AudioControlsComponent],
  templateUrl: './sentence.component.html',
  styleUrls: ['./sentence.component.scss'],
})
export class SentenceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() sentence!: Sentence;
  @Input() displayLanguages: string[] = ['Chinese', 'Pinyin'];
  @Input() showStructure = false;
  @Input() set forceStop(value: number) {
    if (value > 0) {
      this.onStop();
    }
  }
  @Output() wordHighlighted = new EventEmitter<ChineseWord>();

  highlightedGroup: number = -1;
  currentHighlighted: ChineseWord | undefined = undefined;
  playbackState: PlaybackState = PlaybackState.Stopped;

  private destroy$ = new Subject<void>();

  constructor(
    private pinyinService: PinyinService,
    private speechService: SpeechService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sentence'] && !changes['sentence'].firstChange) {
      this.highlightedGroup = -1;
      this.currentHighlighted = undefined;
    }
  }

  ngOnInit() {
    // Synchronize playback state with speech service
    this.speechService.speaking$
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (speaking) => {
          // Update state
          if (speaking) {
            this.updatePlaybackState(PlaybackState.PlayingFast);
          } else {
            this.updatePlaybackState(PlaybackState.Stopped);
          }
        },
        error: (error) => {
          console.error('Failed to monitor speech service state:', error);
          this.updatePlaybackState(PlaybackState.Stopped);
        },
      });
  }

  // Helper to update playback state
  private updatePlaybackState(newState: PlaybackState) {
    if (this.playbackState !== newState) {
      this.playbackState = newState;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isHighlighted(mapping: CharacterMapping): boolean {
    // Don't show highlight if it's punctuation
    if (this.pinyinService.checkPunctuation(mapping.char)) {
      return false;
    }
    return this.highlightedGroup === mapping.groupIndex;
  }

  highlightGroup(mapping: CharacterMapping) {
    // Don't highlight if it's punctuation
    if (this.pinyinService.checkPunctuation(mapping.char)) {
      return;
    }

    if (this.highlightedGroup !== mapping.groupIndex) {
      this.highlightedGroup = mapping.groupIndex;

      const highlightedMappings = this.sentence.characterMappings.filter(
        (m) => m.groupIndex === this.highlightedGroup
      );

      const chars = highlightedMappings.map((m) => m.char).join('');
      const pinyin = highlightedMappings
        .map((m) => m.pinyin)
        .filter((p) => p)
        .join(' ');

      if (chars) {
        // Get audio URLs first, as this will properly split the pinyin
        const audioUrls = this.pinyinService.getAudioUrls(pinyin);

        // Now get the individual syllables by converting the URLs back to pinyin
        const pinyinSyllables = audioUrls.map((url) => {
          // Extract the pinyin from the URL (e.g., from "https://cdn.yoyochinese.com/audio/pychart/zhong1.mp3")
          const syllable = url.split('/').pop()?.replace('.mp3', '') || '';
          // Convert number notation back to tone marks
          return this.pinyinService.convertNumberToToneMark(syllable);
        });

        this.currentHighlighted = {
          characters: chars,
          pinyin: pinyin,
          definition: this.pinyinService.getDefinition(chars),
          audioUrls: audioUrls,
          groupIndex: this.highlightedGroup,
          pinyinSyllables: pinyinSyllables,
        };

        this.wordHighlighted.emit(this.currentHighlighted);
      }
    }
  }

  needsSpace(mapping: CharacterMapping): boolean {
    return (
      !!mapping.pinyin && !this.pinyinService.checkPunctuation(mapping.char)
    );
  }

  getLanguageText(lang: string): string {
    switch (lang) {
      case 'Chinese':
        return this.sentence.chinese;
      case 'Pinyin':
        return this.sentence.pinyin;
      case 'English':
        return this.sentence.english;
      case 'French':
        return this.sentence.french;
      default:
        return '';
    }
  }

  async playHighlightedAudio() {
    if (this.currentHighlighted?.audioUrls?.length) {
      for (const url of this.currentHighlighted.audioUrls) {
        await this.pinyinService.playAudioFile(url);
      }
    }
  }

  async onPlay(slow: boolean) {
    // Stop any current playback first
    this.speechService.stop();
    this.pinyinService.stop();
    
    if (slow) {
      try {
        this.updatePlaybackState(PlaybackState.PlayingSlow);
        const audioUrls = this.getSentenceAudioUrls();
        for (const url of audioUrls) {
          // Check if we're still in slow playback mode before playing each syllable
          if (this.playbackState !== PlaybackState.PlayingSlow) {
            break;
          }
          await this.pinyinService.playAudioFile(url);
        }
      } catch (error) {
        console.error('Failed to play individual character audio:', error);
      } finally {
        // Always reset state when we're done, regardless of success or failure
        this.updatePlaybackState(PlaybackState.Stopped);
      }
    } else {
      try {
        // Don't set state until speech actually starts
        await this.speechService.speak(this.sentence.chinese);
        // State will be updated via the subscription when speech starts
      } catch (error) {
        console.error('Failed to synthesize speech for sentence:', error);
        this.updatePlaybackState(PlaybackState.Stopped);
      }
    }
  }

  onStop() {
    this.speechService.stop();
    this.pinyinService.stop();
    this.updatePlaybackState(PlaybackState.Stopped);
  }

  private getSentenceAudioUrls(): string[] {
    // Group pinyin by character groups and get audio URLs for each group
    const groups = new Map<number, string>();

    // Collect pinyin for each group
    this.sentence.characterMappings
      .filter((mapping) => mapping.pinyin)
      .forEach((mapping) => {
        const existing = groups.get(mapping.groupIndex) || '';
        groups.set(
          mapping.groupIndex,
          existing ? `${existing} ${mapping.pinyin}` : mapping.pinyin
        );
      });

    // Get audio URLs for each group's pinyin
    return Array.from(groups.values()).flatMap((pinyin) =>
      this.pinyinService.getAudioUrls(pinyin)
    );
  }

  public isPunctuation(char: string): boolean {
    return this.pinyinService.checkPunctuation(char);
  }
}
