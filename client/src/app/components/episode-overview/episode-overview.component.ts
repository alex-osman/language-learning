import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, Episode, EpisodeDTO } from '../../services/media.service';
import {
  EnhancedSentenceAnalysisResult,
  SentenceAnalysisService,
} from '../../services/sentence-analysis.service';
import {
  ProgressIndicatorComponent,
  ProgressSegment,
} from '../progress-indicator/progress-indicator.component';
import { EpisodeCharactersComponent } from '../episode-characters/episode-characters.component';

interface EpisodeOverviewData {
  title: string;
  assetUrl: string;
  percentUnderstood: number;
  totalSentencesCount: number;
  progressSegments: ProgressSegment[];
  learnedCount: number;
  seenCount: number;
  unknownCount: number;
}

@Component({
  selector: 'app-episode-overview',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent, EpisodeCharactersComponent],
  templateUrl: './episode-overview.component.html',
  styleUrl: './episode-overview.component.scss',
})
export class EpisodeOverviewComponent implements OnInit {
  mediaId: string = '';
  episodeId: number = 0;

  episode: EpisodeDTO | null = null;
  isLoading = true;
  error: string | null = null;

  // Per-sentence analysis data with full per-character detail
  sentenceAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};
  // Overall episode comprehension from the server
  episodeComprehension: number = 0;

  isCharactersCollapsed = true;
  isSentenceGalleryCollapsed = true;
  Math = Math;

  @ViewChild('episodeVideo') episodeVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.episodeId = params['episodeId'] || 0;

      if (this.mediaId && this.episodeId) {
        this.loadEpisodeData();
      } else {
        this.error = 'Missing required route parameters.';
        this.isLoading = false;
      }
    });
  }

  get episodeData(): EpisodeOverviewData | null {
    if (!this.episode) return null;

    const { learnedCount, seenCount, unknownCount } = this.aggregateCharacterCounts();
    const total = learnedCount + seenCount + unknownCount;

    const progressSegments: ProgressSegment[] = [];
    if (total > 0) {
      if (learnedCount > 0) {
        progressSegments.push({
          value: Math.round((learnedCount / total) * 100),
          color: '#28a745',
          label: 'learned',
        });
      }
      if (seenCount > 0) {
        progressSegments.push({
          value: Math.round((seenCount / total) * 100),
          color: '#17a2b8',
          label: 'seen',
        });
      }
      if (unknownCount > 0) {
        progressSegments.push({
          value: Math.round((unknownCount / total) * 100),
          color: '#dc3545',
          label: 'unknown',
        });
      }
    }

    return {
      title: this.episode.title,
      assetUrl: this.episode.assetUrl,
      percentUnderstood: this.episodeComprehension,
      totalSentencesCount: this.episode.sentences?.length || 0,
      progressSegments,
      learnedCount,
      seenCount,
      unknownCount,
    };
  }

  toggleCharacters() {
    this.isCharactersCollapsed = !this.isCharactersCollapsed;
  }

  toggleSentenceGallery() {
    this.isSentenceGalleryCollapsed = !this.isSentenceGalleryCollapsed;
  }

  private loadEpisodeData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getEpisodeWithSentences(this.episodeId).subscribe({
      next: episodeData => {
        this.episode = episodeData;
        this.isLoading = false;
        this.loadEpisodeProgress();
        this.startSentenceAnalysis();
      },
      error: err => {
        console.error('Error loading episode:', err);
        this.error = 'Failed to load episode data.';
        this.isLoading = false;
      },
    });
  }

  private loadEpisodeProgress() {
    this.mediaService.getEpisodeProgress(this.episodeId).subscribe({
      next: progress => {
        this.episodeComprehension = progress.comprehensionPercentage;
      },
      error: err => {
        console.error('Error loading episode progress:', err);
      },
    });
  }

  private startSentenceAnalysis() {
    if (!this.episode?.sentences?.length) return;

    const texts = this.episode.sentences.map(s => s.sentence);

    this.sentenceAnalysisService.analyzeTextsWithKnowledgeStatus(texts).subscribe({
      next: results => {
        results.forEach((result, index) => {
          if (this.episode!.sentences[index]) {
            this.sentenceAnalysisData[this.episode!.sentences[index].id] = result;
          }
        });
      },
      error: err => console.error('Sentence analysis failed:', err),
    });
  }

  // Deduplicate characters across all sentences using Sets
  private aggregateCharacterCounts(): {
    learnedCount: number;
    seenCount: number;
    unknownCount: number;
  } {
    const learnedSet = new Set<string>();
    const seenSet = new Set<string>();
    const unknownSet = new Set<string>();

    Object.values(this.sentenceAnalysisData).forEach(analysis => {
      analysis.learned_characters?.forEach(c => learnedSet.add(c));
      analysis.seen_characters?.forEach(c => seenSet.add(c));
      analysis.unknown_characters?.forEach(c => {
        if (!learnedSet.has(c) && !seenSet.has(c)) unknownSet.add(c);
      });
    });

    return {
      learnedCount: learnedSet.size,
      seenCount: seenSet.size,
      unknownCount: unknownSet.size,
    };
  }

  getWordUnderlineStyle(sentenceId: number, char: string): { [key: string]: string } {
    const analysis = this.sentenceAnalysisData[sentenceId];
    if (!analysis) return { 'border-bottom': '2px solid #555' };

    const charData = analysis.all_characters?.find(c => c.char === char);
    if (!charData) return { 'border-bottom': '2px solid #555' };

    switch (charData.status) {
      case 'learned':
        return { 'border-bottom': '2px solid #28a745' };
      case 'learning':
        return { 'border-bottom': '2px solid #ffc107' };
      case 'seen':
        return { 'border-bottom': '2px solid #17a2b8' };
      default:
        return { 'border-bottom': '2px solid #555' };
    }
  }

  getSentenceComprehension(sentenceId: number): number {
    const analysis = this.sentenceAnalysisData[sentenceId];
    if (!analysis) return 0;
    return analysis.learned_percent + analysis.seen_percent;
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  startPractice() {
    if (this.episode?.sentences?.length) {
      this.router.navigate(['/sentence-flashcard', this.episodeId], {
        queryParams: { mediaId: this.mediaId, episodeId: this.episodeId },
      });
    }
  }

  toggleVideoPlayPause() {
    if (this.episodeVideo?.nativeElement) {
      const video = this.episodeVideo.nativeElement;
      video.paused ? video.play() : video.pause();
    }
  }

  goToVideo() {
    this.router.navigate(['/media', this.mediaId, 'episodes', this.episodeId, 'video']);
  }

  goToTimestamp(timestamp: number) {
    if (this.episodeVideo?.nativeElement) {
      this.episodeVideo.nativeElement.currentTime = timestamp / 1000;
      this.episodeVideo.nativeElement.play();
    }
  }
}
