import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, SceneDTO, Sentence } from '../../services/media.service';
import { SubtitleOverlayComponent } from '../subtitle-overlay/subtitle-overlay.component';
import { PlayerControlsComponent } from '../player-controls/player-controls.component';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import {
  SentenceAnalysisService,
  EnhancedSentenceAnalysisResult,
} from '../../services/sentence-analysis.service';

interface SubtitleLayers {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
}

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, SubtitleOverlayComponent, PlayerControlsComponent, ProgressIndicatorComponent],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('sentenceList') sentenceList!: ElementRef<HTMLDivElement>;

  // Route parameters
  mediaId: string = '';
  episodeId: string = '';
  sceneId: number = 0;

  // Component state
  scene: SceneDTO | null = null;
  isLoading = true;
  error: string | null = null;

  // Video state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;

  // Subtitle state
  currentSentence: Sentence | null = null;
  subtitleLayers: SubtitleLayers = {
    chinese: true,
    pinyin: true,
    english: false,
  };

  // Available playback speeds
  playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Sentence analysis data
  enhancedAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};

  private timeUpdateInterval?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  ngAfterViewInit() {
    // Setup video listeners after view initialization
    if (this.scene) {
      this.setupVideoListeners();
    }
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

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
    // Setup video listeners after the view is initialized
    setTimeout(() => this.setupVideoListeners(), 0);
    // Start sentence analysis for highlighting
    this.startSentenceAnalysis();
  }

  private handleSceneLoadError(err: any) {
    console.error('Error loading scene:', err);
    this.error = 'Failed to load scene data.';
    this.isLoading = false;
  }

  private setupVideoListeners() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;

      video.addEventListener('loadedmetadata', () => {
        this.duration = video.duration;
      });

      video.addEventListener('timeupdate', () => {
        this.currentTime = video.currentTime;
        this.updateCurrentSubtitle();
      });

      video.addEventListener('play', () => {
        this.isPlaying = true;
      });

      video.addEventListener('pause', () => {
        this.isPlaying = false;
      });

      video.addEventListener('volumechange', () => {
        this.volume = video.volume;
      });

      video.addEventListener('ratechange', () => {
        this.playbackRate = video.playbackRate;
      });
    }
  }

  private updateCurrentSubtitle() {
    if (!this.scene?.sentences) return;

    const currentTimeMs = this.currentTime * 1000;
    const currentSentence = this.scene.sentences.find(
      sentence => currentTimeMs >= sentence.startMs && currentTimeMs <= sentence.endMs
    );

    const previousSentence = this.currentSentence;
    this.currentSentence = currentSentence || null;

    // Trigger autoscroll if sentence changed and autoscroll is enabled
    if (this.currentSentence && this.currentSentence !== previousSentence) {
      this.scrollToCurrentSentence();
    }
  }

  // Video control methods
  togglePlayPause() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  seekTo(time: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = time;
    }
  }

  setVolume(volume: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.volume = volume;
    }
  }

  setPlaybackRate(rate: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.playbackRate = rate;
    }
  }

  private scrollToCurrentSentence() {
    if (!this.currentSentence || !this.sentenceList?.nativeElement) return;

    const sentenceElement = this.sentenceList.nativeElement.querySelector(
      `[data-sentence-id="${this.currentSentence.id}"]`
    ) as HTMLElement;

    if (sentenceElement) {
      sentenceElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }

  // Subtitle control methods
  toggleSubtitleLayer(layer: keyof SubtitleLayers) {
    this.subtitleLayers[layer] = !this.subtitleLayers[layer];
  }

  goToSentence(sentence: Sentence) {
    this.seekTo(sentence.startMs / 1000);
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
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
  }

  private handleAnalysisError(chinese: string, err: any) {
    console.error('Error analyzing sentence:', chinese, err);
  }

  // ===== CHARACTER HIGHLIGHTING =====

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

  // ===== PROGRESS CALCULATION =====
  
  get sceneProgressPercent(): number {
    if (!this.scene || !this.hasAnalysisData()) {
      return 0;
    }

    const { totalKnownCharacters, totalCharacters } = this.aggregateAnalysisData();

    if (totalCharacters === 0) {
      return 0;
    }

    return Math.round((totalKnownCharacters / totalCharacters) * 100);
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
}
