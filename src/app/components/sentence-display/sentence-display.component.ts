import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceComponent } from '../sentence/sentence.component';
import { Sentence } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';
import { SENTENCE_DATA } from '../../data/sentences.data';

@Component({
  selector: 'app-sentence-display',
  standalone: true,
  imports: [CommonModule, SentenceComponent],
  templateUrl: './sentence-display.component.html',
  styleUrls: ['./sentence-display.component.scss']
})
export class SentenceDisplayComponent implements OnInit {
  sentences: Sentence[] = SENTENCE_DATA
  
  languages: string[] = ['Chinese', 'Pinyin', 'English', 'French'];
  selectedLanguages: string[] = ['Chinese', 'Pinyin'];
  currentHighlighted: ChineseWord | null = null;

  constructor(private pinyinService: PinyinService) {}

  ngOnInit() {
  }

  get displayLanguages(): string[] {
    return this.selectedLanguages;
  }

  selectAll() {
    this.selectedLanguages = [...this.languages];
  }

  clearAll() {
    this.selectedLanguages = [];
  }

  toggleLanguage(lang: string) {
    const index = this.selectedLanguages.indexOf(lang);
    if (index === -1) {
      this.selectedLanguages.push(lang);
    } else {
      this.selectedLanguages.splice(index, 1);
    }
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
      console.log('Pinyin syllables:', syllables);
      return syllables;
    }
    return this.currentHighlighted.pinyinSyllables;
  }
} 