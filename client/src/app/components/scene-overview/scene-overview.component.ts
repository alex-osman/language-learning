import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, SceneDTO } from '../../services/media.service';
import {
  EnhancedSentenceAnalysisResult,
  SentenceAnalysisResult,
  SentenceAnalysisService,
} from '../../services/sentence-analysis.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

interface SceneOverviewData {
  title: string;
  assetUrl: string;
  percentUnderstood: number;
  newSentencesCount: number;
  uniqueCharacters: string[];
  sentences: Array<{
    id: number;
    chinese: string;
    knownCache: number;
    startMs: number;
  }>;
}

@Component({
  selector: 'app-scene-overview',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
  templateUrl: './scene-overview.component.html',
  styleUrl: './scene-overview.component.scss',
})
export class SceneOverviewComponent implements OnInit {
  // Route parameters
  mediaId: string = '';
  episodeId: string = '';
  sceneId: number = 0;

  // Component state
  scene: SceneDTO | null = null;
  isLoading = true;
  error: string | null = null;
  enhancedAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};

  // UI state
  displayedCharacters: string[] = [];
  hasMoreCharacters = false;

  // Template helpers
  Math = Math;

  // Video reference
  @ViewChild('sceneVideo') sceneVideo!: ElementRef<HTMLVideoElement>;

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

  get sceneData(): SceneOverviewData | null {
    if (!this.scene) return null;

    const actualProgress = this.calculateActualProgress();

    return {
      title: this.scene.title,
      assetUrl: this.scene.assetUrl,
      percentUnderstood: actualProgress.percentKnown,
      newSentencesCount: this.scene.sentences.length,
      uniqueCharacters: this.extractUniqueCharacters(),
      sentences: this.scene.sentences.map(sentence => ({
        id: sentence.id,
        chinese: sentence.sentence,
        knownCache: this.sentenceKnownCache(sentence.id),
        startMs: sentence.startMs,
      })),
    };
  }

  sentenceKnownCache(sentenceId: number): number {
    return Math.round(
      ((this.enhancedAnalysisData[sentenceId]?.learned_count +
        this.enhancedAnalysisData[sentenceId]?.learning_count) /
        this.enhancedAnalysisData[sentenceId]?.total_characters) *
        100
    );
  }

  // ===== INITIALIZATION =====

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.episodeId = params['episodeId'] || '';
      this.sceneId = params['sceneId'] || '';

      if (this.hasValidRouteParameters()) {
        this.loadSceneData();
      } else {
        this.handleRouteError();
      }
    });
  }

  private hasValidRouteParameters(): boolean {
    return !!(this.mediaId && this.episodeId && this.sceneId);
  }

  private handleRouteError() {
    this.error = 'Missing required route parameters.';
    this.isLoading = false;
  }

  // ===== DATA LOADING =====

  private loadSceneData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getScene(this.sceneId).subscribe({
      next: scene => this.handleSceneLoaded(scene),
      error: err => this.handleSceneLoadError(err),
    });
  }

  private handleSceneLoaded(scene: SceneDTO) {
    this.scene = scene;
    this.isLoading = false;
    this.updateDisplayedCharacters();
    this.startSentenceAnalysis();
  }

  private handleSceneLoadError(err: any) {
    console.error('Error loading scene:', err);
    this.error = 'Failed to load scene data.';
    this.isLoading = false;
  }

  // ===== SENTENCE ANALYSIS =====

  private startSentenceAnalysis() {
    if (!this.scene) return;

    const texts = this.scene.sentences.map(sentence => sentence.sentence);
    
    this.sentenceAnalysisService.analyzeTextsWithKnowledgeStatus(texts).subscribe({
      next: results => this.handleBatchAnalysisResults(results),
      error: err => this.handleBatchAnalysisError(err),
    });
  }

  private handleBatchAnalysisResults(results: EnhancedSentenceAnalysisResult[]) {
    // Map results back to sentence IDs
    results.forEach((result, index) => {
      if (this.scene && this.scene.sentences[index]) {
        const sentenceId = this.scene.sentences[index].id;
        this.enhancedAnalysisData[sentenceId] = result;
      }
    });
    
    this.updateDisplayedCharacters();
  }

  private handleBatchAnalysisError(err: any) {
    console.error('Error analyzing sentences in batch:', err);
    // Fallback to individual analysis if batch fails
    this.fallbackToIndividualAnalysis();
  }

  private fallbackToIndividualAnalysis() {
    if (!this.scene) return;

    this.scene.sentences.forEach(sentence => {
      this.analyzeSentence(sentence.id, sentence.sentence);
    });
  }

  private analyzeSentence(sentenceId: number, chinese: string) {
    this.sentenceAnalysisService.analyzeTextWithKnowledgeStatus(chinese).subscribe({
      next: result => this.handleAnalysisResult(sentenceId, result),
      error: err => this.handleAnalysisError(chinese, err),
    });
  }

  private handleAnalysisResult(sentenceId: number, result: EnhancedSentenceAnalysisResult) {
    this.enhancedAnalysisData[sentenceId] = result;
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
    if (!this.scene || !this.hasAnalysisData()) {
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
    return Object.keys(this.enhancedAnalysisData).length > 0;
  }

  private aggregateAnalysisData(): { totalKnownCharacters: number; totalCharacters: number } {
    let totalKnownCharacters = 0;
    let totalCharacters = 0;

    this.scene!.sentences.forEach(sentence => {
      const analysis = this.enhancedAnalysisData[sentence.id];
      if (analysis) {
        totalKnownCharacters += analysis.learned_count;
        totalCharacters += analysis.total_characters;
      } else {
        totalCharacters += sentence.sentence.length;
      }
    });

    return { totalKnownCharacters, totalCharacters };
  }

  private extractUniqueCharacters(): string[] {
    if (!this.scene) return [];

    const allText = this.scene.sentences.map(s => s.sentence).join('');
    const uniqueChars = [...new Set(allText.split(''))].filter(char =>
      /[\u4e00-\u9fff]/.test(char)
    );

    return uniqueChars;
  }

  // ===== UI UPDATES =====

  private updateDisplayedCharacters() {
    if (!this.sceneData) return;

    const maxDisplayed = 5;
    this.displayedCharacters = this.sceneData.uniqueCharacters.slice(0, maxDisplayed);
    this.hasMoreCharacters = this.sceneData.uniqueCharacters.length > maxDisplayed;
  }

  // ===== USER ACTIONS =====

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  openVideoPlayer() {
    this.router.navigate(['video'], { relativeTo: this.route });
  }

  startPractice() {
    this.router.navigate(['/sentence-flashcard', this.sceneId], {
      queryParams: {
        mediaId: this.mediaId,
        episodeId: this.episodeId,
      },
    });
  }

  toggleVideoPlayPause() {
    if (this.sceneVideo?.nativeElement) {
      const video = this.sceneVideo.nativeElement;
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

  goToTimestamp(timestamp: number) {
    if (this.sceneVideo?.nativeElement) {
      // Convert milliseconds to seconds
      const timeInSeconds = timestamp / 1000;
      this.sceneVideo.nativeElement.currentTime = timeInSeconds;

      // Pause the video if it's playing to let user see the specific moment
      this.sceneVideo.nativeElement.play();

      console.log(`Navigated to timestamp: ${timeInSeconds}s`);
    } else {
      console.warn('Video element not found');
    }
  }

  getWordUnderlineStyle(sentenceId: number, char: string): { [key: string]: string } {
    const analysis = this.enhancedAnalysisData[sentenceId];
    if (!analysis) {
      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    const charData = analysis.all_characters.find(c => c.char === char);
    if (!charData) {
      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    if (charData.status !== 'learned' && charData.status !== 'learning') {
      if (charData.status === 'seen') {
        return { 'border-bottom': '3px solid #53b1ff' };
      }

      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    // Get color based on easiness factor if available
    if (charData.charData?.easinessFactor) {
      const color = this.getUnderlineColor(charData.charData.easinessFactor);
      return { 'border-bottom': `3px solid ${color}` };
    }

    // Fallback to green for known characters without easiness data
    return { 'border-bottom': '3px solid #2e7d32' }; // Darker green
  }

  // Specific method for underline colors with higher saturation and lower lightness
  private getUnderlineColor(easinessFactor: number): string {
    const minEasiness = 1.3;
    const maxEasiness = 2.5;

    // Normalize easiness factor
    const normalizedEasiness = Math.max(
      0,
      Math.min(1, (easinessFactor - minEasiness) / (maxEasiness - minEasiness))
    );

    // Calculate hue (red to green)
    const hue = 0 + normalizedEasiness * 120; // 0 = red, 120 = green

    // Use higher saturation and lower lightness for more vivid underlines
    const saturation = 80; // Higher saturation
    const lightness = 50; // Lower lightness for more vivid colors

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}
