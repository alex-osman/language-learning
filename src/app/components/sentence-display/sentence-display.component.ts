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
} 