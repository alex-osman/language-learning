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
  seasonId: string = '';
  episodeId: string = '';
  sceneId: string = '';
  sentenceAnalysisData: { [sentenceId: string]: SentenceAnalysisResult } = {};

  constructor(
    private mediaService: MediaService,
    private route: ActivatedRoute,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit(): void {
    this.mediaId = this.route.snapshot.paramMap.get('mediaId') || '';
    this.seasonId = this.route.snapshot.paramMap.get('seasonId') || '';
    this.episodeId = this.route.snapshot.paramMap.get('episodeId') || '';
    this.sceneId = this.route.snapshot.paramMap.get('sceneId') || '';
    if (!this.mediaId || !this.seasonId || !this.episodeId || !this.sceneId) {
      this.error = 'No media, season, episode, or scene selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService
      .getSentencesForScene(this.mediaId, this.seasonId, this.episodeId, this.sceneId)
      .subscribe({
        next: sentences => {
          this.sentences = sentences;
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
      this.sentenceAnalysisService.analyzeSentence(sentence.chinese).subscribe({
        next: result => {
          this.sentenceAnalysisData[sentence.id] = result;
        },
      });
    });
  }
}
