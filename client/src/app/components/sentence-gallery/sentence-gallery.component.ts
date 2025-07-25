import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MediaService, Sentence } from '../../services/media.service';
import {
  SentenceAnalysisResult,
  SentenceAnalysisService,
} from 'src/app/services/sentence-analysis.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-sentence-gallery',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
  templateUrl: './sentence-gallery.component.html',
  styleUrls: ['./sentence-gallery.component.scss'],
})
export class SentenceGalleryComponent implements OnInit {
  sentences: Sentence[] = [];
  isLoading = true;
  error: string | null = null;
  mediaId: string = '';
  episodeId: number = 0;
  sentenceAnalysisData: { [sentenceId: string]: SentenceAnalysisResult } = {};

  constructor(
    private mediaService: MediaService,
    private route: ActivatedRoute,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit(): void {
    this.mediaId = this.route.snapshot.paramMap.get('mediaId') || '';
    this.episodeId = parseInt(this.route.snapshot.paramMap.get('episodeId') || '0');
    if (!this.mediaId || !this.episodeId) {
      this.error = 'No media or episode selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService
      .getEpisodeWithSentences(this.episodeId)
      .subscribe({
        next: episode => {
          this.sentences = episode.sentences || [];
          this.isLoading = false;
          this.getProgress();
        },
        error: () => {
          this.error = 'Failed to load sentences.';
          this.isLoading = false;
        },
      });
  }

  getProgress(): void {
    this.sentences.forEach(sentence => {
      this.sentenceAnalysisService.analyzeSentence(sentence.sentence).subscribe({
        next: result => {
          this.sentenceAnalysisData[sentence.id] = result;
        },
      });
    });
  }
}
