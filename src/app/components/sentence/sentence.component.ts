import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sentence, CharacterMapping } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SpeechService } from '../../services/speech.service';
import { Subscription, combineLatest } from 'rxjs';

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

  highlightedGroup: number = -1;
  currentHighlighted: ChineseWord | undefined = undefined;
  isPlayingSlow = false;
  isPlayingFast = false;
  private subscriptions = new Subscription();

  constructor(private pinyinService: PinyinService, private speechService: SpeechService) {}

  ngOnInit() {
    // Combine both speaking status and current sentence subscriptions
    this.subscriptions.add(
      combineLatest([
        this.speechService.speaking$,
        this.speechService.currentSentence$
      ]).subscribe({
        next: ([speaking, currentSentence]) => {
          // Only show as playing if this sentence is the current one
          this.isPlayingFast = speaking && currentSentence === this.sentence.chinese;
        },
        error: (error) => {
          console.error('Speech service error:', error);
          this.isPlayingFast = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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
        this.currentHighlighted = {
          characters: chars,
          pinyin: pinyin,
          definition: this.pinyinService.getDefinition(chars),
          audioUrls: pinyin ? this.pinyinService.getAudioUrls(pinyin) : [],
          groupIndex: this.highlightedGroup
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
    // If clicking the same button that's currently playing, just stop
    if ((slow && this.isPlayingSlow) || (!slow && this.isPlayingFast)) {
      if (slow) {
        this.isPlayingSlow = false;
      } else {
        this.speechService.stop();
      }
      return;
    }

    // Stop any ongoing playback
    if (this.isPlayingSlow || this.isPlayingFast) {
      if (this.isPlayingFast) {
        this.speechService.stop();
      }
      this.isPlayingSlow = false;
      this.isPlayingFast = false;
    }

    if (slow) {
      try {
        this.isPlayingSlow = true;
        const audioUrls = this.getSentenceAudioUrls();
        for (const url of audioUrls) {
          if (!this.isPlayingSlow) break; // Check if stopped
          await this.pinyinService.playAudioFile(url);
        }
      } catch (error) {
        console.error('Slow audio playback error:', error);
      } finally {
        // Only reset if this component's slow playback is active
        if (this.isPlayingSlow) {
          this.isPlayingSlow = false;
        }
      }
    } else {
      try {
        this.isPlayingFast = true;
        await this.speechService.speak(this.sentence.chinese);
      } catch (error) {
        console.error('Speech synthesis error:', error);
      } finally {
        // Only reset if this component's fast playback is active
        if (this.isPlayingFast) {
          this.isPlayingFast = false;
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