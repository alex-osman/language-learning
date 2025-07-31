import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, EpisodeDTO, Sentence } from '../../services/media.service';
import { SubtitleOverlayComponent } from '../subtitle-overlay/subtitle-overlay.component';
import { PlayerControlsComponent } from '../player-controls/player-controls.component';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import { CharacterTooltipComponent } from '../character-tooltip/character-tooltip.component';
import { CharacterHoverDirective, CharacterHoverEvent } from '../../directives/character-hover.directive';
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
  imports: [
    CommonModule,
    SubtitleOverlayComponent,
    PlayerControlsComponent,
    ProgressIndicatorComponent,
    CharacterTooltipComponent,
    CharacterHoverDirective,
  ],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('sentenceList') sentenceList!: ElementRef<HTMLDivElement>;

  // Route parameters
  mediaId: string = '';
  episodeId: number = 0;

  // Component state
  episode: EpisodeDTO | null = null;
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
  playbackSpeeds = [0.65, 0.75, 0.85, 0.95, 1, 1.15, 1.5, 2, 4, 8];

  // Sentence analysis data
  enhancedAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};

  // Character hover state
  hoveredCharacter: any = null;
  tooltipPosition = { x: 0, y: 0 };
  private hideTooltipTimeout: any = null;

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
    if (this.episode) {
      this.setupVideoListeners();
    }
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    
    // Clean up tooltip timeout
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
    }
  }

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.episodeId = parseInt(params['episodeId']) || 0;

      if (this.hasValidRouteParameters()) {
        this.loadEpisodeData();
      } else {
        this.handleRouteError();
      }
    });
  }

  private hasValidRouteParameters(): boolean {
    return !!(this.mediaId && this.episodeId);
  }

  private handleRouteError() {
    this.error = 'Missing required route parameters.';
    this.isLoading = false;
  }

  private loadEpisodeData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getEpisodeWithSentences(this.episodeId).subscribe({
      next: episode => this.handleEpisodeLoaded(episode),
      error: err => this.handleEpisodeLoadError(err),
    });
  }

  private handleEpisodeLoaded(episode: EpisodeDTO) {
    this.episode = episode;
    this.isLoading = false;
    // Setup video listeners after the view is initialized
    setTimeout(() => this.setupVideoListeners(), 0);
    // Start sentence analysis for highlighting
    this.startSentenceAnalysis();
  }

  private handleEpisodeLoadError(err: any) {
    console.error('Error loading episode:', err);
    this.error = 'Failed to load episode data.';
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
    if (!this.episode?.sentences) return;

    const currentTimeMs = this.currentTime * 1000;
    const currentSentence = this.episode.sentences.find(
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
    if (!this.episode) return;

    const texts = this.episode.sentences.map(sentence => sentence.sentence);

    this.sentenceAnalysisService.analyzeTextsWithKnowledgeStatus(texts).subscribe({
      next: results => this.handleBatchAnalysisResults(results),
      error: err => this.handleBatchAnalysisError(err),
    });
  }

  private handleBatchAnalysisResults(results: EnhancedSentenceAnalysisResult[]) {
    // Map results back to sentence IDs
    results.forEach((result, index) => {
      if (this.episode && this.episode.sentences[index]) {
        const sentenceId = this.episode.sentences[index].id;
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
    if (!this.episode) return;

    this.episode.sentences.forEach(sentence => {
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

  get episodeProgressPercent(): number {
    if (!this.episode || !this.hasAnalysisData()) {
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

    this.episode!.sentences.forEach(sentence => {
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

  // ===== CHARACTER HOVER =====

  onCharacterHover(event: CharacterHoverEvent) {
    // Clear any pending hide timeout immediately
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
    
    const sentenceId = this.getSentenceIdFromCharacter(event.element);
    if (!sentenceId) return;
    
    const analysis = this.enhancedAnalysisData[sentenceId];
    if (!analysis) return;

    const charData = analysis.all_characters.find(c => c.char === event.character);
    if (!charData) return;

    // Immediately switch to new character
    this.hoveredCharacter = charData;

    // Position tooltip above the character element (like Lingopie)
    this.tooltipPosition = {
      x: event.rect.left + (event.rect.width / 2), // Center horizontally on character
      y: event.rect.top - 10 // Position tooltip bottom above character top
    };
  }

  onCharacterLeave() {
    // Set timeout to hide tooltip after delay (allows moving between characters)
    this.hideTooltipTimeout = setTimeout(() => {
      this.hoveredCharacter = null;
      this.hideTooltipTimeout = null;
    }, 100);
  }

  private getSentenceIdFromCharacter(element: HTMLElement): number | null {
    // Walk up the DOM tree to find the sentence container with data-sentence-id
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-sentence-id')) {
        return parseInt(current.getAttribute('data-sentence-id') || '0', 10);
      }
      current = current.parentElement!;
    }
    return null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only handle keyboard shortcuts if we're not in an input field
    if (
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      switch (event.code) {
        case 'Space':
          event.preventDefault(); // Prevent page scroll
          this.togglePlayPause();
          break;
        case 'KeyC':
          event.preventDefault();
          this.toggleChineseSubtitleMode();
          break;
        case 'Comma':
        case 'Period':
          if (event.shiftKey) {
            event.preventDefault();
            if (event.code === 'Comma') {
              this.decreasePlaybackSpeed();
            } else {
              this.increasePlaybackSpeed();
            }
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.goToPreviousSentence();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.goToNextSentence();
          break;
      }
    }
  }

  private increasePlaybackSpeed() {
    const currentIndex = this.playbackSpeeds.indexOf(this.playbackRate);
    if (currentIndex < this.playbackSpeeds.length - 1) {
      const newSpeed = this.playbackSpeeds[currentIndex + 1];
      this.setPlaybackRate(newSpeed);
    }
  }

  private decreasePlaybackSpeed() {
    const currentIndex = this.playbackSpeeds.indexOf(this.playbackRate);
    if (currentIndex > 0) {
      const newSpeed = this.playbackSpeeds[currentIndex - 1];
      this.setPlaybackRate(newSpeed);
    }
  }

  private toggleChineseSubtitleMode() {
    if (this.subtitleLayers.chinese && this.subtitleLayers.pinyin) {
      // If both are on, turn off pinyin
      this.subtitleLayers.pinyin = false;
    } else if (this.subtitleLayers.chinese && !this.subtitleLayers.pinyin) {
      // If only Chinese is on, turn on pinyin
      this.subtitleLayers.pinyin = true;
    } else {
      // In any other state, set to Chinese only
      this.subtitleLayers.chinese = true;
      this.subtitleLayers.pinyin = false;
    }
  }

  private goToPreviousSentence() {
    if (!this.episode?.sentences) return;

    const currentTimeMs = this.currentTime * 1000;
    let previousSentence: Sentence | undefined;

    // Find the previous sentence
    for (let i = this.episode.sentences.length - 1; i >= 0; i--) {
      const sentence = this.episode.sentences[i];
      if (sentence.startMs < currentTimeMs - 100) {
        // Add small buffer to handle edge cases
        previousSentence = sentence;
        break;
      }
    }

    // If we found a previous sentence, go to it
    if (previousSentence) {
      this.goToSentence(previousSentence);
    } else if (this.episode.sentences.length > 0) {
      // If we're before the first sentence, go to the first sentence
      this.goToSentence(this.episode.sentences[0]);
    }
  }

  private goToNextSentence() {
    if (!this.episode?.sentences) return;

    const currentTimeMs = this.currentTime * 1000;
    let nextSentence: Sentence | undefined;

    // Find the next sentence
    for (const sentence of this.episode.sentences) {
      if (sentence.startMs > currentTimeMs + 100) {
        // Add small buffer to handle edge cases
        nextSentence = sentence;
        break;
      }
    }

    // If we found a next sentence, go to it
    if (nextSentence) {
      this.goToSentence(nextSentence);
    }
  }
}
