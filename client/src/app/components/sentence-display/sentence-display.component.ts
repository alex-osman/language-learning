import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceComponent } from '../sentence/sentence.component';
import { HighlightSidebarComponent } from '../highlight-sidebar/highlight-sidebar.component';
import { LanguageControlsComponent } from '../language-controls/language-controls.component';
import { Sentence } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SpeechService } from '../../services/speech.service';
import { SENTENCE_DATA } from '../../data/sentences.data';

@Component({
  selector: 'app-sentence-display',
  standalone: true,
  imports: [
    CommonModule,
    SentenceComponent,
    HighlightSidebarComponent,
    LanguageControlsComponent
  ],
  templateUrl: './sentence-display.component.html',
  styleUrls: ['./sentence-display.component.scss']
})
export class SentenceDisplayComponent implements OnInit {
  sentences: Sentence[] = SENTENCE_DATA;
  activeSentence: Sentence | null = null;
  forceStopCounter = 0;  // Used to trigger the forceStop input
  
  languages: string[] = ['Chinese', 'Pinyin', 'English', 'French'];
  selectedLanguages: string[] = ['Chinese', 'Pinyin'];
  get displayLanguages(): string[] {
    return this.selectedLanguages;
  }
  
  currentHighlighted: ChineseWord | null = null;

  constructor(
    private pinyinService: PinyinService,
    private speechService: SpeechService
  ) {}

  ngOnInit() {
    if (this.sentences.length > 0) {
      this.selectSentence(this.sentences[0]);
    }
  }

  selectSentence(sentence: Sentence) {
    // Stop any current audio playback
    this.speechService.stop();
    this.pinyinService.stop();
    
    // Force stop on any currently playing sentence components
    this.forceStopCounter++;
    
    // Reset all state
    this.currentHighlighted = null;
    this.activeSentence = sentence;
  }

  onSelectedLanguagesChange(languages: string[]) {
    this.selectedLanguages = languages;
  }

  async playAudio(url: string) {
    await this.pinyinService.playAudioFile(url);
  }

  onWordHighlighted(word: ChineseWord) {
    this.currentHighlighted = word;
  }

  getPinyinSyllables(): string[] {
    if (!this.currentHighlighted?.pinyinSyllables) {
      // If pinyinSyllables is not set, try to split the pinyin intelligently
      const pinyin = this.currentHighlighted?.pinyin || '';
      // Remove any punctuation and split by spaces
      const cleanPinyin = pinyin.replace(/[.,，。]/g, '').trim();
      
      // First try to use the number of audio URLs as a guide
      if (this.currentHighlighted?.audioUrls) {
        const numSyllables = this.currentHighlighted.audioUrls.length;
        if (numSyllables === 1) {
          return [cleanPinyin];
        }
      }
      
      // If that doesn't work, split by spaces and try to handle multi-syllable words
      const syllables = cleanPinyin.split(/[\s\u00A0]+/).filter(s => s.length > 0);
      return syllables;
    }
    return this.currentHighlighted.pinyinSyllables;
  }
} 