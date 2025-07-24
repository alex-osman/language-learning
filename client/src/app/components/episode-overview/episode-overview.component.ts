import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, Episode, Scene, EpisodeDTO } from '../../services/media.service';
import {
  SentenceAnalysisResult,
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
  scenes: Array<{
    id: number;
    title: string;
    knownCache: number;
    sentenceCount: number;
    startMs: number;
  }>;
  // NEW: Enhanced progress data
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
  // Route parameters
  mediaId: string = '';
  seasonId: string = '';
  episodeId: number = 0;

  // Component state
  episode: Episode | null = null;
  episodeAssetUrl: string = ''; // Store assetUrl separately since Episode interface doesn't have it
  isLoading = true;
  error: string | null = null;
  sentenceAnalysisData: { [sentenceId: string]: SentenceAnalysisResult } = {};
  enhancedAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};

  // UI state
  isScriptView = true;
  isCharactersCollapsed = false;
  // Template helpers
  Math = Math;

  // Video reference
  @ViewChild('episodeVideo') episodeVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  // ===== COMPUTED PROPERTIES =====

  get episodeData(): EpisodeOverviewData | null {
    if (!this.episode) return null;

    const actualProgress = this.calculateActualProgress();
    const progressSegments = this.calculateProgressSegments();

    return {
      title: this.episode.title,
      assetUrl: this.episodeAssetUrl,
      percentUnderstood: actualProgress.percentKnown,
      totalSentencesCount: this.getTotalSentenceCount(),
      scenes: this.episode.scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        knownCache: scene.knownCache,
        sentenceCount: scene.sentences?.length || 0,
        startMs: 0, // Scene interface doesn't have startMs, we'll use 0 for now
      })),
      progressSegments: progressSegments.filter(segment => segment.label !== 'unknown'),
      learnedCount: actualProgress.learnedCharacters,
      seenCount: actualProgress.seenCharacters,
      unknownCount: actualProgress.unknownCharacters,
    };
  }

  // ===== INITIALIZATION =====
  toggleCharacters() {
    this.isCharactersCollapsed = !this.isCharactersCollapsed;
  }

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.seasonId = params['seasonId'] || '';
      this.episodeId = params['episodeId'] || '';

      if (this.hasValidRouteParameters()) {
        this.loadEpisodeData();
      } else {
        this.handleRouteError();
      }
    });
  }

  private hasValidRouteParameters(): boolean {
    return !!(this.mediaId && this.seasonId && this.episodeId);
  }

  private handleRouteError() {
    this.error = 'Missing required route parameters.';
    this.isLoading = false;
  }

  // ===== DATA LOADING =====

  private loadEpisodeData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getScenesForEpisode(this.episodeId).subscribe({
      next: episodeData => this.handleEpisodeLoaded(episodeData),
      error: err => this.handleEpisodeLoadError(err),
    });
  }

  private handleEpisodeLoaded(episodeData: EpisodeDTO) {
    // Store the assetUrl separately
    this.episodeAssetUrl = episodeData.assetUrl;

    // Transform the data to match our Episode interface
    this.episode = {
      id: episodeData.id,
      title: episodeData.title,
      number: 0, // We'll need to get this from the episode list
      scenes: episodeData.scenes || [],
      knownCache: 0,
    };

    this.isLoading = false;
    this.startSentenceAnalysis();
  }

  private handleEpisodeLoadError(err: any) {
    console.error('Error loading episode:', err);
    this.error = 'Failed to load episode data.';
    this.isLoading = false;
  }

  // ===== SENTENCE ANALYSIS =====

  private startSentenceAnalysis() {
    if (!this.episode) return;

    // Clear existing analysis data
    this.sentenceAnalysisData = {};
    this.enhancedAnalysisData = {};

    const allSentences = this.episode.scenes.flatMap(scene => scene.sentences || []);

    if (allSentences.length === 0) return;

    // Use enhanced analysis for better progress tracking
    allSentences.forEach(sentence => {
      this.sentenceAnalysisService.analyzeTextWithKnowledgeStatus(sentence.sentence).subscribe({
        next: (analysis: EnhancedSentenceAnalysisResult) => {
          this.enhancedAnalysisData[sentence.id] = analysis;
        },
        error: err => {
          console.error(`Enhanced analysis failed for sentence ${sentence.id}:`, err);
          // Fallback to basic analysis
          this.sentenceAnalysisService.analyzeSentence(sentence.sentence).subscribe({
            next: (analysis: SentenceAnalysisResult) => {
              this.sentenceAnalysisData[sentence.id] = analysis;
            },
            error: err => {
              console.error(`Fallback analysis failed for sentence ${sentence.id}:`, err);
            },
          });
        },
      });
    });
  }

  // ===== CALCULATIONS =====

  private calculateActualProgress(): {
    percentKnown: number;
    knownCharacters: number;
    totalCharacters: number;
    learnedCharacters: number;
    seenCharacters: number;
    unknownCharacters: number;
  } {
    if (!this.episode || !this.hasEnhancedAnalysisData()) {
      return {
        percentKnown: 0,
        knownCharacters: 0,
        totalCharacters: 0,
        learnedCharacters: 0,
        seenCharacters: 0,
        unknownCharacters: 0,
      };
    }

    const { totalLearnedCharacters, totalSeenCharacters, totalUnknownCharacters, totalCharacters } =
      this.aggregateEnhancedAnalysisData();

    if (totalCharacters === 0) {
      return {
        percentKnown: 0,
        knownCharacters: 0,
        totalCharacters: 0,
        learnedCharacters: 0,
        seenCharacters: 0,
        unknownCharacters: 0,
      };
    }

    const knownCharacters = totalLearnedCharacters + totalSeenCharacters;
    const percentKnown = Math.round((knownCharacters / totalCharacters) * 100);

    return {
      percentKnown,
      knownCharacters,
      totalCharacters,
      learnedCharacters: totalLearnedCharacters,
      seenCharacters: totalSeenCharacters,
      unknownCharacters: totalUnknownCharacters,
    };
  }

  private hasEnhancedAnalysisData(): boolean {
    if (!this.episode) return false;

    const allSentences = this.episode.scenes.flatMap(scene => scene.sentences || []);
    return (
      allSentences.length > 0 &&
      allSentences.every(sentence => this.enhancedAnalysisData[sentence.id] !== undefined)
    );
  }

  private aggregateEnhancedAnalysisData(): {
    totalLearnedCharacters: number;
    totalSeenCharacters: number;
    totalUnknownCharacters: number;
    totalCharacters: number;
  } {
    // Use Sets to track unique characters by status
    const learnedChars = new Set<string>();
    const seenChars = new Set<string>();
    const unknownChars = new Set<string>();

    this.episode!.scenes.forEach(scene => {
      if (scene.sentences) {
        scene.sentences.forEach(sentence => {
          const analysis = this.enhancedAnalysisData[sentence.id];
          if (analysis) {
            // Add unique characters to appropriate sets
            analysis.learned_characters.forEach(char => learnedChars.add(char));
            analysis.seen_characters.forEach(char => seenChars.add(char));
            analysis.unknown_characters.forEach(char => unknownChars.add(char));
          }
        });
      }
    });

    const totalLearnedCharacters = learnedChars.size;
    const totalSeenCharacters = seenChars.size;
    const totalUnknownCharacters = unknownChars.size;
    const totalCharacters = totalLearnedCharacters + totalSeenCharacters + totalUnknownCharacters;

    return { totalLearnedCharacters, totalSeenCharacters, totalUnknownCharacters, totalCharacters };
  }

  private getTotalSentenceCount(): number {
    if (!this.episode) return 0;

    return this.episode.scenes.reduce((total, scene) => {
      return total + (scene.sentences?.length || 0);
    }, 0);
  }

  private calculateProgressSegments(): ProgressSegment[] {
    const progress = this.calculateActualProgress();

    if (progress.totalCharacters === 0) {
      return [];
    }

    const learnedPercent = Math.round(
      (progress.learnedCharacters / progress.totalCharacters) * 100
    );
    const seenPercent = Math.round((progress.seenCharacters / progress.totalCharacters) * 100);
    const unknownPercent = Math.round(
      (progress.unknownCharacters / progress.totalCharacters) * 100
    );

    const segments: ProgressSegment[] = [];

    if (learnedPercent > 0) {
      segments.push({
        value: learnedPercent,
        color: '#28a745', // Green for learned
        label: 'learned',
      });
    }

    if (seenPercent > 0) {
      segments.push({
        value: seenPercent,
        color: '#17a2b8', // Cyan for seen
        label: 'seen',
      });
    }

    if (unknownPercent > 0) {
      segments.push({
        value: unknownPercent,
        color: '#dc3545', // Red for unknown
        label: 'unknown',
      });
    }

    return segments;
  }

  // ===== UI UPDATES =====

  // ===== USER ACTIONS =====

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  startPractice() {
    // Navigate to the first scene for practice, or implement episode-level practice
    if (this.episode && this.episode.scenes.length > 0) {
      const firstScene = this.episode.scenes[0];
      this.router.navigate(['/sentence-flashcard', firstScene.id], {
        queryParams: {
          mediaId: this.mediaId,
          seasonId: this.seasonId,
          episodeId: this.episodeId,
        },
      });
    }
  }

  toggleVideoPlayPause() {
    if (this.episodeVideo?.nativeElement) {
      const video = this.episodeVideo.nativeElement;
      if (video.paused) {
        video.play();
        console.log('Video resumed');
      } else {
        video.pause();
        console.log('Video paused');
      }
    } else {
      console.warn('Video element not found');
    }
  }

  goToScene(scene: any) {
    this.router.navigate([
      '/media',
      this.mediaId,
      'seasons',
      this.seasonId,
      'episodes',
      this.episodeId,
      'scenes',
      scene.id,
    ]);
  }

  toggleView() {
    this.isScriptView = !this.isScriptView;
  }
}
