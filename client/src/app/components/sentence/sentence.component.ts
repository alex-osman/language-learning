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
import { Sentence, CharacterMapping } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SpeechService } from '../../services/speech.service';
import { TtsService } from '../../services/tts.service';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { AudioControlsComponent } from '../audio-controls/audio-controls.component';
import { PlaybackState } from '../audio-controls/playback-state.enum';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { Language } from '@shared/types/languages';

@Component({
  selector: 'app-sentence',
  standalone: true,
  imports: [CommonModule, AudioControlsComponent, CopyButtonComponent],
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
  private mp3Audio: HTMLAudioElement | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private pinyinService: PinyinService,
    private speechService: SpeechService,
    private ttsService: TtsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sentence'] && !changes['sentence'].firstChange) {
      this.highlightedGroup = -1;
      this.currentHighlighted = undefined;
    }
  }

  ngOnInit() {
    // Synchronize playback state with speech service
    this.speechService.speaking$.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe({
      next: speaking => {
        // Update state
        if (speaking) {
          this.updatePlaybackState(PlaybackState.PlayingFast);
        } else {
          this.updatePlaybackState(PlaybackState.Stopped);
        }
      },
      error: error => {
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

  highlightGroup(mapping: CharacterMapping) {
    // Don't highlight if it's punctuation
    if (this.pinyinService.checkPunctuation(mapping.char)) {
      return;
    }

    if (this.highlightedGroup !== mapping.groupIndex) {
      this.highlightedGroup = mapping.groupIndex;

      const highlightedMappings = this.sentence.characterMappings.filter(
        m => m.groupIndex === this.highlightedGroup
      );

      const chars = highlightedMappings.map(m => m.char).join('');
      const pinyin = highlightedMappings
        .map(m => m.pinyin)
        .filter(p => p)
        .join(' ');

      if (chars) {
        // Get audio URLs first, as this will properly split the pinyin
        const url = this.pinyinService.getAudioUrl(pinyin);

        // Now get the individual syllables by converting the URLs back to pinyin
        const pinyinSyllables = this.pinyinService.convertNumberToToneMark(url);

        this.currentHighlighted = {
          characters: chars,
          pinyin: pinyin,
          definition: this.pinyinService.getDefinition(chars),
          audioUrls: [url],
          groupIndex: this.highlightedGroup,
          pinyinSyllables: [pinyinSyllables],
        };

        this.wordHighlighted.emit(this.currentHighlighted);
      }
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
    if (this.mp3Audio) {
      this.mp3Audio.pause();
      this.mp3Audio.currentTime = 0;
      this.mp3Audio = null;
    }
    this.updatePlaybackState(PlaybackState.Stopped);
  }

  async onMp3() {
    // Stop any current playback first
    this.onStop();

    try {
      const mp3Path = `/assets/sentence${this.sentence.id}.mp3`;
      this.mp3Audio = new Audio(mp3Path);

      this.mp3Audio.addEventListener('ended', () => {
        this.updatePlaybackState(PlaybackState.Stopped);
        this.mp3Audio = null;
      });

      this.updatePlaybackState(PlaybackState.PlayingMp3);
      await this.mp3Audio.play();
    } catch (error) {
      console.error('Failed to play MP3:', error);
      this.updatePlaybackState(PlaybackState.Stopped);
    }
  }

  async onTts() {
    // Stop any current playback first
    this.onStop();

    try {
      this.updatePlaybackState(PlaybackState.PlayingTts);
      await this.ttsService.generateSpeech(this.sentence.chinese);
      this.updatePlaybackState(PlaybackState.Stopped);
    } catch (error) {
      console.error('Failed to play TTS:', error);
      this.updatePlaybackState(PlaybackState.Stopped);
    }
  }

  private getSentenceAudioUrls(): string[] {
    // Group pinyin by character groups and get audio URLs for each group
    const groups = new Map<number, string>();

    // Collect pinyin for each group
    this.sentence.characterMappings
      .filter(mapping => mapping.pinyin)
      .forEach(mapping => {
        const existing = groups.get(mapping.groupIndex) || '';
        groups.set(mapping.groupIndex, existing ? `${existing} ${mapping.pinyin}` : mapping.pinyin);
      });

    // Get audio URLs for each group's pinyin
    return Array.from(groups.values()).flatMap(pinyin => this.pinyinService.getAudioUrl(pinyin));
  }

  public isPunctuation(char: string): boolean {
    return this.pinyinService.checkPunctuation(char);
  }

  public needsSpace(mapping: CharacterMapping): boolean {
    // Add space after each character unless it's punctuation or the last character in its group
    if (this.isPunctuation(mapping.char)) {
      return false;
    }

    const nextMapping = this.sentence.characterMappings.find(
      m => m.groupIndex === mapping.groupIndex + 1
    );
    return nextMapping !== undefined;
  }

  public isHighlighted(mapping: CharacterMapping): boolean {
    return mapping.groupIndex === this.highlightedGroup;
  }

  public getLanguageText(lang: string): string {
    return this.sentence[lang.toLowerCase() as keyof Sentence] as string;
  }
}
