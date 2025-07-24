import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, Episode, Scene, EpisodeDTO } from '../../services/media.service';
import {
  SentenceAnalysisResult,
  SentenceAnalysisService,
} from '../../services/sentence-analysis.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

interface EpisodeOverviewData {
  title: string;
  assetUrl: string;
  percentUnderstood: number;
  totalSentencesCount: number;
  uniqueCharacters: string[];
  scenes: Array<{
    id: number;
    title: string;
    percentKnown: number;
    sentenceCount: number;
    startMs: number;
  }>;
}

@Component({
  selector: 'app-episode-overview',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
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

  // UI state
  displayedCharacters: string[] = [];
  hasMoreCharacters = false;
  isScriptView = true;

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

    return {
      title: this.episode.title,
      assetUrl: this.episodeAssetUrl,
      percentUnderstood: actualProgress.percentKnown,
      totalSentencesCount: this.getTotalSentenceCount(),
      uniqueCharacters: this.extractUniqueCharacters(),
      scenes: this.episode.scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        percentKnown: this.calculateSceneProgress(scene),
        sentenceCount: scene.sentences?.length || 0,
        startMs: 0, // Scene interface doesn't have startMs, we'll use 0 for now
      })),
    };
  }

  // ===== INITIALIZATION =====

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
    this.updateDisplayedCharacters();
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

    this.episode.scenes.forEach(scene => {
      if (scene.sentences) {
        scene.sentences.forEach(sentence => {
          this.analyzeSentence(sentence.id, sentence.sentence);
        });
      }
    });
  }

  private analyzeSentence(sentenceId: number, chinese: string) {
    this.sentenceAnalysisService.analyzeSentence(chinese).subscribe({
      next: result => this.handleAnalysisResult(sentenceId, result),
      error: err => this.handleAnalysisError(chinese, err),
    });
  }

  private handleAnalysisResult(sentenceId: number, result: SentenceAnalysisResult) {
    this.sentenceAnalysisData[sentenceId] = result;
    this.updateDisplayedCharacters();
  }

  private handleAnalysisError(chinese: string, err: any) {
    console.error('Error analyzing sentence:', chinese, err);
  }

  // ===== CALCULATIONS =====

  private calculateActualProgress(): {
    percentKnown: number;
    knownCharacters: number;
    totalCharacters: number;
  } {
    if (!this.episode || !this.hasAnalysisData()) {
      return { percentKnown: 0, knownCharacters: 0, totalCharacters: 0 };
    }

    const { totalKnownCharacters, totalCharacters } = this.aggregateAnalysisData();

    if (totalCharacters === 0) {
      return { percentKnown: 0, knownCharacters: 0, totalCharacters: 0 };
    }

    const percentKnown = Math.round((totalKnownCharacters / totalCharacters) * 100);

    return {
      percentKnown,
      knownCharacters: totalKnownCharacters,
      totalCharacters,
    };
  }

  private hasAnalysisData(): boolean {
    return Object.keys(this.sentenceAnalysisData).length > 0;
  }

  private aggregateAnalysisData(): { totalKnownCharacters: number; totalCharacters: number } {
    let totalKnownCharacters = 0;
    let totalCharacters = 0;

    this.episode!.scenes.forEach(scene => {
      if (scene.sentences) {
        scene.sentences.forEach(sentence => {
          const analysis = this.sentenceAnalysisData[sentence.id];
          if (analysis) {
            totalKnownCharacters += analysis.known_count;
            totalCharacters += analysis.total_characters;
          }
        });
      }
    });

    return { totalKnownCharacters, totalCharacters };
  }

  private getTotalSentenceCount(): number {
    if (!this.episode) return 0;

    return this.episode.scenes.reduce((total, scene) => {
      return total + (scene.sentences?.length || 0);
    }, 0);
  }

  private calculateSceneProgress(scene: Scene): number {
    if (!scene.sentences || scene.sentences.length === 0) return 0;

    let totalKnown = 0;
    let totalCharacters = 0;

    scene.sentences.forEach(sentence => {
      const analysis = this.sentenceAnalysisData[sentence.id];
      if (analysis) {
        totalKnown += analysis.known_count;
        totalCharacters += analysis.total_characters;
      }
    });

    return totalCharacters > 0 ? Math.round((totalKnown / totalCharacters) * 100) : 0;
  }

  private extractUniqueCharacters(): string[] {
    if (!this.episode) return [];

    const allText = this.episode.scenes
      .map(scene => scene.sentences?.map(s => s.sentence).join('') || '')
      .join('');

    const uniqueChars = [...new Set(allText.split(''))].filter(char =>
      /[\u4e00-\u9fff]/.test(char)
    );

    return uniqueChars;
  }

  // ===== UI UPDATES =====

  private updateDisplayedCharacters() {
    if (!this.episodeData) return;

    const maxDisplayed = 5;
    this.displayedCharacters = this.episodeData.uniqueCharacters.slice(0, maxDisplayed);
    this.hasMoreCharacters = this.episodeData.uniqueCharacters.length > maxDisplayed;
  }

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
