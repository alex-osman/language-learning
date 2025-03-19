import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sentence, CharacterMapping } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SpeechService } from '../../services/speech.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

enum PlaybackState {
  Stopped = 'stopped',
  PlayingSlow = 'playing_slow',
  PlayingFast = 'playing_fast'
}

@Component({
  selector: 'app-sentence',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sentence.component.html',
  styleUrls: ['./sentence.component.scss']
})
export class SentenceComponent implements OnInit, OnDestroy {
  @Input() sentence!: Sentence;
  @Input() displayLanguages: string[] = ['Chinese', 'Pinyin'];
  @Input() showStructure = false;
  @Output() wordHighlighted = new EventEmitter<ChineseWord>();

  readonly PlaybackState = PlaybackState; // Expose enum to template
  
  highlightedGroup: number = -1;
  currentHighlighted: ChineseWord | undefined = undefined;
  playbackState: PlaybackState = PlaybackState.Stopped;
  
  private destroy$ = new Subject<void>();

  constructor(private pinyinService: PinyinService, private speechService: SpeechService) {}

  ngOnInit() {
    // Monitor speech service state
    combineLatest([
      this.speechService.speaking$,
      this.speechService.currentSentence$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([speaking, currentSentence]) => {
        // Only show as playing if this sentence is the current one
        if (speaking && currentSentence === this.sentence.chinese) {
          this.playbackState = PlaybackState.PlayingFast;
        } else if (this.playbackState === PlaybackState.PlayingFast) {
          this.playbackState = PlaybackState.Stopped;
        }
      },
      error: (error) => {
        console.error('Speech service error:', error);
        this.playbackState = PlaybackState.Stopped;
      }
    });
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
        m => m.groupIndex === this.highlightedGroup
      );
      
      const chars = highlightedMappings.map(m => m.char).join('');
      const pinyin = highlightedMappings.map(m => m.pinyin).filter(p => p).join(' ');
      
      if (chars) {
        // Get audio URLs first, as this will properly split the pinyin
        const audioUrls = this.pinyinService.getAudioUrls(pinyin);
        
        // Now get the individual syllables by converting the URLs back to pinyin
        const pinyinSyllables = audioUrls.map(url => {
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
          pinyinSyllables: pinyinSyllables
        };

        this.wordHighlighted.emit(this.currentHighlighted);
      }
    }
  }

  needsSpace(mapping: CharacterMapping): boolean {
    return !!mapping.pinyin && !this.pinyinService.checkPunctuation(mapping.char);
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

  async playSentenceAudio(slow: boolean = false) {
    const targetState = slow ? PlaybackState.PlayingSlow : PlaybackState.PlayingFast;
    
    // If clicking the same button that's currently playing, just stop
    if (this.playbackState === targetState) {
      if (slow) {
        this.playbackState = PlaybackState.Stopped;
      } else {
        this.speechService.stop();
      }
      return;
    }

    // Stop any ongoing playback
    if (this.playbackState !== PlaybackState.Stopped) {
      if (this.playbackState === PlaybackState.PlayingFast) {
        this.speechService.stop();
      }
      this.playbackState = PlaybackState.Stopped;
    }

    if (slow) {
      try {
        this.playbackState = PlaybackState.PlayingSlow;
        const audioUrls = this.getSentenceAudioUrls();
        for (const url of audioUrls) {
          if (this.playbackState !== PlaybackState.PlayingSlow) break; // Check if stopped
          await this.pinyinService.playAudioFile(url);
        }
      } catch (error) {
        console.error('Slow audio playback error:', error);
      } finally {
        // Only reset if this component's slow playback is active
        if (this.playbackState === PlaybackState.PlayingSlow) {
          this.playbackState = PlaybackState.Stopped;
        }
      }
    } else {
      try {
        this.playbackState = PlaybackState.PlayingFast;
        await this.speechService.speak(this.sentence.chinese);
      } catch (error) {
        console.error('Speech synthesis error:', error);
      } finally {
        // Only reset if this component's fast playback is active
        if (this.playbackState === PlaybackState.PlayingFast) {
          this.playbackState = PlaybackState.Stopped;
        }
      }
    }
  }

  private getSentenceAudioUrls(): string[] {
    const audioUrls: string[] = [];
    
    const groups = new Map<number, string[]>();
    this.sentence.characterMappings.forEach(mapping => {
      if (mapping.pinyin) {
        if (!groups.has(mapping.groupIndex)) {
          groups.set(mapping.groupIndex, []);
        }
        groups.get(mapping.groupIndex)!.push(mapping.pinyin);
      }
    });

    groups.forEach(pinyinArray => {
      const pinyin = pinyinArray.join(' ');
      if (pinyin) {
        audioUrls.push(...this.pinyinService.getAudioUrls(pinyin));
      }
    });

    return audioUrls;
  }

  public isPunctuation(char: string): boolean {
    return this.pinyinService.checkPunctuation(char);
  }
} 