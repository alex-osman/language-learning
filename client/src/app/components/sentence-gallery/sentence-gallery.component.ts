import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SentenceService, SentenceDTO } from '../../services/sentence.service';
import { Router } from '@angular/router';
import { SpeechService } from 'src/app/services/speech.service';
import { TtsService } from 'src/app/services/tts.service';

@Component({
  selector: 'app-sentence-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sentence-gallery.component.html',
  styleUrls: ['./sentence-gallery.component.scss'],
})
export class SentenceGalleryComponent implements OnInit {
  sentences: SentenceDTO[] = [];
  filteredSentences: SentenceDTO[] = [];
  isLoading = true;
  error: string | null = null;
  searchTerm = '';
  currentFilter: 'all' | 'due' = 'all';

  constructor(
    private sentenceService: SentenceService,
    private router: Router,
    private speechService: SpeechService,
    private ttsService: TtsService
  ) {}

  ngOnInit(): void {
    this.loadSentences();
  }

  private loadSentences(): void {
    this.isLoading = true;
    this.error = null;

    this.sentenceService.getAllSentences().subscribe({
      next: sentences => {
        this.sentences = sentences;
        this.applyFilters();
        this.isLoading = false;
      },
      error: error => {
        console.error('Error fetching sentences:', error);
        this.error = 'Failed to load sentences. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  async playAudio(sentenceId: number): Promise<void> {
    const sentence = this.sentences.find(s => s.id === sentenceId);
    if (sentence?.audioUrl) {
      const audioUrl = sentence.audioUrl;
      const audio = new Audio(audioUrl);
      audio.play();
    } else if (sentence?.sentence) {
      await this.ttsService.generateSpeech(sentence.sentence);
    }
  }

  applyFilters(): void {
    let result = [...this.sentences];

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.sentence?.toLowerCase().includes(term) ||
          s.pinyin?.toLowerCase().includes(term) ||
          s.translation?.toLowerCase().includes(term) ||
          s.source?.toLowerCase().includes(term)
      );
    }

    // Filter by due status
    if (this.currentFilter === 'due') {
      result = result.filter(s => s.dueForReview);
    }

    // Sort by ID (can be changed to other sorting methods later)
    result.sort((a, b) => a.id - b.id);

    this.filteredSentences = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  setFilter(filter: 'all' | 'due'): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  viewSentenceDetail(id: number): void {
    // For future implementation of detail view
    console.log(`View sentence detail for ID: ${id}`);
  }

  getLevelClass(level: number | undefined): string {
    if (!level) return 'level-unknown';

    if (level <= 2) return 'level-beginner';
    if (level <= 4) return 'level-elementary';
    if (level <= 6) return 'level-intermediate';
    if (level <= 8) return 'level-advanced';
    return 'level-master';
  }
}
