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
  analysisResults: { character: string; isKnown: boolean; charData: CharacterDTO }[] = [];
  totalCharacters: number = 0;
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

    // Remove spaces and split into individual characters
    const chars = this.inputText.replace(/\s+/g, '').split('');

    this.analysisResults = chars.map(char => {
      const knownChar = this.characters.find(c => c.character === char);
      return {
        character: char,
        isKnown: knownChar ? this.hasCharacterData(knownChar) : false,
        charData: knownChar as CharacterDTO,
      };
    });

    this.updateStats();
  }

  private hasCharacterData(char: CharacterDTO): boolean {
    return !!(char.pinyin && char.definition);
  }

  private updateStats() {
    this.totalCharacters = this.analysisResults.length;
    this.knownCharacters = this.analysisResults.filter(r => r.isKnown).length;
    this.unknownCharacters = this.totalCharacters - this.knownCharacters;
    this.knownPercentage =
      this.totalCharacters > 0
        ? Math.round((this.knownCharacters / this.totalCharacters) * 100)
        : 0;
  }

  private resetStats() {
    this.totalCharacters = 0;
    this.knownCharacters = 0;
    this.unknownCharacters = 0;
    this.knownPercentage = 0;
  }
}
