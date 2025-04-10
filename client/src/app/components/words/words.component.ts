import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, WordDTO } from '../../services/data.service';

@Component({
  selector: 'app-words',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './words.component.html',
  styleUrls: ['./words.component.scss'],
})
export class WordsComponent implements OnInit {
  words: WordDTO[] = [];
  selectedWord: WordDTO | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadWords();
  }

  private loadWords() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getWords().subscribe({
      next: words => {
        this.words = words;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading words:', err);
        this.error = 'Failed to load words. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  onWordClick(word: WordDTO) {
    this.selectedWord = word === this.selectedWord ? null : word;
  }

  hasWordData(word: WordDTO): boolean {
    return !!(word.pinyin && word.definition);
  }

  clearSelection() {
    this.selectedWord = null;
  }
}
