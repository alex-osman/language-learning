import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, CharacterDTO } from '../../services/data.service';

@Component({
  selector: 'app-sentence-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sentence-analyzer.component.html',
  styleUrls: ['./sentence-analyzer.component.scss'],
})
export class SentenceAnalyzerComponent implements OnInit {
  inputText: string = '';
  characters: CharacterDTO[] = [];
  analysisResults: {
    character: string;
    isKnown: boolean;
    charData?: CharacterDTO;
    count: number;
  }[] = [];
  totalCharacters: number = 0;
  uniqueCharacters: number = 0;
  knownCharacters: number = 0;
  unknownCharacters: number = 0;
  knownPercentage: number = 0;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadCharacters();
  }

  private loadCharacters() {
    this.dataService.getCharacters().subscribe(characters => {
      this.characters = characters;
      if (this.inputText) {
        this.analyzeText();
      }
    });
  }

  analyzeText() {
    if (!this.inputText) {
      this.analysisResults = [];
      this.resetStats();
      return;
    }

    // Remove spaces, punctuation, and non-Chinese characters
    const chars = this.inputText
      .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
      .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
      .split('');

    // Count occurrences of each character
    const charCounts = new Map<string, number>();
    chars.forEach(char => {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    });

    // Create analysis results with counts
    this.analysisResults = Array.from(charCounts.entries()).map(([char, count]) => {
      const knownChar = this.characters.find(c => c.character === char);
      return {
        character: char,
        isKnown: knownChar ? this.hasCharacterData(knownChar) : false,
        charData: knownChar,
        count: count,
      };
    });

    this.updateStats();
  }

  private hasCharacterData(char: CharacterDTO): boolean {
    return !!(char.pinyin && char.definition);
  }

  private updateStats() {
    this.totalCharacters = this.analysisResults.reduce((sum, result) => sum + result.count, 0);
    this.uniqueCharacters = this.analysisResults.length;
    this.knownCharacters = this.analysisResults.filter(r => r.isKnown).length;
    this.unknownCharacters = this.uniqueCharacters - this.knownCharacters;
    this.knownPercentage =
      this.uniqueCharacters > 0
        ? Math.round((this.knownCharacters / this.uniqueCharacters) * 100)
        : 0;
  }

  private resetStats() {
    this.totalCharacters = 0;
    this.uniqueCharacters = 0;
    this.knownCharacters = 0;
    this.unknownCharacters = 0;
    this.knownPercentage = 0;
  }
}
