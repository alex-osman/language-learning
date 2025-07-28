import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SentenceFlashcardService, SentenceDTO } from '../../services/sentence-flashcard.service';
import {
  SentenceAnalysisService,
  AnalyzedCharacter,
  SentenceAnalysisResult,
} from '../../services/sentence-analysis.service';
import { CharacterAnalysisComponent } from '../character-analysis/character-analysis.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-random-sentence-flashcard',
  standalone: true,
  imports: [CommonModule, CharacterAnalysisComponent],
  templateUrl: './random-sentence-flashcard.component.html',
  styleUrls: ['./random-sentence-flashcard.component.scss'],
})
export class RandomSentenceFlashcardComponent implements OnInit, OnDestroy {
  // Video element reference is provided lazily when it first appears in the DOM (inside an *ngIf)
  private videoInitialised = false;

  private videoElement!: ElementRef<HTMLVideoElement>; // Assigned in the setter below

  @ViewChild('sceneVideo', { static: false })
  set sceneVideo(el: ElementRef<HTMLVideoElement> | undefined) {
    // This setter is called every time the view is checked. We only need to initialise once.
    if (el && !this.videoInitialised) {
      this.videoElement = el;
      this.initializeVideoPlayer();
      this.videoInitialised = true;
    }
  }

  // State management
  remainingSentences: (SentenceDTO & {
    episodeTitle?: string;
    assetUrl?: string;
    comprehensionPercentage?: number;
  })[] = [];
  currentSentence:
    | (SentenceDTO & { episodeTitle?: string; assetUrl?: string; comprehensionPercentage?: number })
    | null = null;
  isFlipped = false;
  isLoading = true;
  isReviewing = false;
  isProcessingReview = false;
  isProcessingExclusion = false;
  selectedRating: number | null = null;
  error: string | null = null;
  reviewCompleted = false;

  // Video timing state
  isVideoPlaying = false;
  isVideoReady = false;
  isWaitingForUserInput = false;
  canRevealAnswer = false;
  sentencePlaybackCompleted = false;

  // Character analysis state
  showAnalysis = false;
  analysisResults: AnalyzedCharacter[] = [];
  analysisStats = {
    totalCharacters: 0,
    knownCharacters: 0,
    unknownCharacters: 0,
    knownPercentage: 0,
  };
  isAnalyzing = false;
  analysisError: string | null = null;

  // Review stats
  reviewStats = {
    total: 0,
    current: 0,
    correct: 0,
    incorrect: 0,
  };

  // Config
  batchSize = 10; // Number of sentences to load at once

  // Template helpers
  Math = Math;

  private subscriptions: Subscription[] = [];
  private videoTimeUpdateListener?: () => void;

  constructor(
    private router: Router,
    private sentenceFlashcardService: SentenceFlashcardService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.loadRandomSentences();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.removeVideoEventListeners();
  }

  // ===== VIDEO INITIALIZATION =====

  private initializeVideoPlayer() {
    if (!this.videoElement) {
      return;
    }

    const video = this.videoElement.nativeElement;

    // Wait for video to load
    video.addEventListener('loadedmetadata', () => {
      this.isVideoReady = true;
      video.pause(); // Start paused
    });

    video.addEventListener('ended', () => {
      this.isVideoPlaying = false;
      // If video ends naturally (especially on last sentence), trigger reveal state
      if (this.currentSentence && !this.canRevealAnswer) {
        this.pauseVideoAtSentenceEnd();
      }
    });

    video.addEventListener('error', e => {
      console.error('Video error:', e);
      this.error = 'Failed to load video. Please check the video file.';
    });

    // Set up time update listener
    this.videoTimeUpdateListener = () => {
      this.onVideoTimeUpdate();
    };
    video.addEventListener('timeupdate', this.videoTimeUpdateListener);
  }

  private removeVideoEventListeners() {
    if (this.videoElement && this.videoTimeUpdateListener) {
      this.videoElement.nativeElement.removeEventListener(
        'timeupdate',
        this.videoTimeUpdateListener
      );
    }
  }

  // ===== VIDEO TIMING CONTROL =====

  private onVideoTimeUpdate() {
    if (!this.currentSentence || !this.videoElement || !this.isVideoPlaying) return;

    const video = this.videoElement.nativeElement;
    const currentTimeMs = video.currentTime * 1000;

    // Add some tolerance and ensure we're actually past the start time
    const startMs = this.currentSentence.startMs || 0;
    const endMs = this.currentSentence.endMs || 0;

    // Only check for end time if we're past the start time and have valid timing
    if (endMs > 0 && currentTimeMs > startMs + 100 && currentTimeMs >= endMs - 50) {
      this.pauseVideoAtSentenceEnd();
    }
  }

  private pauseVideoAtSentenceEnd() {
    if (!this.videoElement) return;

    const video = this.videoElement.nativeElement;
    video.pause();
    this.isVideoPlaying = false;
    this.sentencePlaybackCompleted = true;
    this.isWaitingForUserInput = true;
    this.canRevealAnswer = true;
  }

  private playVideoForCurrentSentence() {
    if (!this.videoElement || !this.currentSentence || !this.getCurrentAssetUrl()) return;

    const video = this.videoElement.nativeElement;

    // Set video source if it has changed
    const currentAssetUrl = this.getCurrentAssetUrl();
    if (video.src !== currentAssetUrl) {
      video.src = currentAssetUrl;
      this.isVideoReady = false;

      // Wait for video to load before playing
      video.addEventListener(
        'loadedmetadata',
        () => {
          this.isVideoReady = true;
          this.startVideoPlayback();
        },
        { once: true }
      );
    } else {
      this.startVideoPlayback();
    }
  }

  private startVideoPlayback() {
    if (!this.videoElement || !this.currentSentence) return;

    const video = this.videoElement.nativeElement;

    // Reset states BEFORE setting time
    this.sentencePlaybackCompleted = false;
    this.isWaitingForUserInput = false;
    this.canRevealAnswer = false;
    this.isFlipped = false;
    this.isVideoPlaying = false; // Important: set to false first

    // Set video to start time of current sentence
    const startTimeSeconds = (this.currentSentence.startMs || 0) / 1000;
    video.currentTime = startTimeSeconds;

    // Small delay to ensure currentTime is set properly
    setTimeout(() => {
      // Play the video
      video
        .play()
        .then(() => {
          this.isVideoPlaying = true;
          console.log(
            `Playing sentence ${this.currentSentence!.id} from ${
              this.currentSentence!.startMs
            }ms to ${this.currentSentence!.endMs}ms`
          );
        })
        .catch(err => {
          console.error('Error playing video:', err);
          this.error = 'Failed to play video. Please try again.';
        });
    }, 100);
  }

  // ===== DATA LOADING =====

  public loadRandomSentences() {
    this.isLoading = true;
    this.error = null;

    // Try to get comprehensible sentences first (80% comprehension)
    const sub = this.sentenceFlashcardService
      .getRandomComprehensibleSentences(this.batchSize, 70)
      .subscribe({
        next: response => {
          if (response.sentences.length > 0) {
            // We got comprehensible sentences
            this.remainingSentences = response.sentences;
            this.reviewStats.total = response.total;
            console.log('Loaded comprehensible sentences', this.remainingSentences);
          } else {
            // Fallback to regular random sentences if no comprehensible ones available
            console.log('No comprehensible sentences found, falling back to random sentences');
            this.loadFallbackRandomSentences();
            return;
          }

          this.isLoading = false;
          this.showNextSentence();
        },
        error: err => {
          console.error('Error loading comprehensible sentences:', err);
          // Fallback to regular random sentences on error
          console.log('Falling back to random sentences due to error');
          this.loadFallbackRandomSentences();
        },
      });

    this.subscriptions.push(sub);
  }

  private loadFallbackRandomSentences() {
    const sub = this.sentenceFlashcardService.getRandomSentences(this.batchSize).subscribe({
      next: response => {
        this.remainingSentences = response.sentences;
        this.reviewStats.total = response.total;
        this.isLoading = false;
        console.log('Loaded fallback random sentences', this.remainingSentences);
        this.showNextSentence();
      },
      error: err => {
        console.error('Error loading fallback random sentences:', err);
        this.error = 'Failed to load sentences. Please try again.';
        this.isLoading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  // ===== FLASHCARD LOGIC =====

  private showNextSentence() {
    // Reset review state
    this.selectedRating = null;
    this.isFlipped = false;
    this.sentencePlaybackCompleted = false;
    this.isWaitingForUserInput = false;
    this.canRevealAnswer = false;

    // Reset video state - but don't reset videoInitialised as the element might still be valid
    this.isVideoReady = false;
    this.isVideoPlaying = false;

    // Reset analysis state
    this.showAnalysis = false;
    this.analysisResults = [];
    this.analysisStats = {
      totalCharacters: 0,
      knownCharacters: 0,
      unknownCharacters: 0,
      knownPercentage: 0,
    };
    this.isAnalyzing = false;
    this.analysisError = null;

    // Reset exclusion state
    this.isProcessingExclusion = false;

    if (this.remainingSentences.length > 0) {
      console.log('Showing next sentence', this.remainingSentences);
      this.currentSentence = this.remainingSentences.shift() || null;
      this.reviewStats.current = this.batchSize - this.remainingSentences.length;
      this.isReviewing = true;
      this.isProcessingReview = false;

      // Wait a moment for UI to update, then start video playback
      setTimeout(() => {
        this.playVideoForCurrentSentence();
      }, 1000);
    } else {
      // Check if we want to load more sentences or complete the session
      if (this.reviewStats.current < this.batchSize) {
        // We completed all sentences in this batch, offer to load more
        this.currentSentence = null;
        this.isReviewing = false;
        this.reviewCompleted = true;
        this.isProcessingReview = false;
        this.isVideoPlaying = false;
      } else {
        // Load more sentences
        this.loadRandomSentences();
      }
    }
  }

  // ===== USER INTERACTIONS =====

  revealAnswer() {
    console.log('revealAnswer', this.canRevealAnswer, this.isProcessingReview);
    if (!this.canRevealAnswer || this.isProcessingReview) return;

    this.isFlipped = true;
    this.isWaitingForUserInput = false;

    // Automatically analyze the sentence for underlining when card is flipped
    if (this.analysisResults.length === 0) {
      this.analyzeSentence(false);
    }
  }

  flipCard() {
    // In video-synced mode, we use revealAnswer() instead
    if (this.canRevealAnswer) {
      this.revealAnswer();
    }
  }

  replayVideoSegment() {
    if (!this.currentSentence || this.isProcessingReview) return;

    this.playVideoForCurrentSentence();
  }

  submitReview(quality: number) {
    if (!this.currentSentence || this.isProcessingReview) return;

    // Immediately set processing state to prevent double submissions
    this.isProcessingReview = true;
    this.selectedRating = quality;

    // Update stats
    if (quality >= 3) {
      this.reviewStats.correct++;
    } else {
      this.reviewStats.incorrect++;
    }

    const sub = this.sentenceFlashcardService
      .reviewSentence(this.currentSentence.id, quality)
      .subscribe({
        next: () => {
          // Add a short delay before transitioning to the next sentence
          setTimeout(() => {
            this.showNextSentence();
          }, 800);
        },
        error: err => {
          console.error('Error submitting review:', err);
          this.error = 'Failed to submit review. Please try again.';
          this.isProcessingReview = false;
          setTimeout(() => {
            this.showNextSentence();
          }, 800);
        },
      });

    this.subscriptions.push(sub);
  }

  excludeSentence() {
    if (!this.currentSentence || this.isProcessingExclusion || this.isProcessingReview) return;

    // Set processing state to prevent multiple submissions
    this.isProcessingExclusion = true;

    const sub = this.sentenceFlashcardService.excludeSentence(this.currentSentence.id).subscribe({
      next: () => {
        console.log(`Sentence ${this.currentSentence!.id} excluded successfully`);
        // Add a short delay before transitioning to the next sentence
        setTimeout(() => {
          this.showNextSentence();
        }, 800);
      },
      error: (err: any) => {
        console.error('Error excluding sentence:', err);
        this.error = 'Failed to exclude sentence. Please try again.';
        this.isProcessingExclusion = false;
      },
    });

    this.subscriptions.push(sub);
  }

  loadMoreSentences() {
    this.reviewCompleted = false;
    this.loadRandomSentences();
  }

  // ===== NAVIGATION =====

  goBack() {
    this.router.navigate(['/']);
  }

  // ===== HELPERS =====

  getCurrentAssetUrl(): string {
    // Use the asset URL from the sentence's episode information
    return this.currentSentence?.assetUrl || '';
  }

  getCurrentTitle(): string {
    return this.currentSentence?.episodeTitle || 'Random Sentence Practice';
  }

  // ===== CHARACTER ANALYSIS =====

  analyzeSentence(showModal: boolean = true) {
    if (!this.currentSentence || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.analysisError = null;

    const sub = this.sentenceAnalysisService.analyzeSentenceId(this.currentSentence.id).subscribe({
      next: (analysis: SentenceAnalysisResult) => {
        this.analysisResults = analysis.all_characters;
        this.analysisStats = {
          totalCharacters: analysis.total_characters,
          knownCharacters: analysis.known_count,
          unknownCharacters: analysis.unknown_count,
          knownPercentage: analysis.known_percent,
        };
        if (showModal) {
          this.showAnalysis = true;
        }
        this.isAnalyzing = false;
      },
      error: err => {
        console.error('Error analyzing sentence:', err);
        this.analysisError = 'Failed to analyze sentence. Please try again.';
        this.isAnalyzing = false;
      },
    });

    this.subscriptions.push(sub);
  }

  toggleAnalysis() {
    if (this.showAnalysis) {
      this.showAnalysis = false;
    } else if (this.analysisResults.length > 0) {
      this.showAnalysis = true;
    } else {
      this.analyzeSentence(true);
    }
  }

  closeAnalysis() {
    this.showAnalysis = false;
  }

  // ===== CHARACTER UNDERLINING =====

  getWordUnderlineStyle(char: string): { [key: string]: string } {
    if (!this.analysisResults || this.analysisResults.length === 0) {
      return { 'border-bottom': '3px solid #999999' }; // Grey for unknown
    }

    const charData = this.analysisResults.find(c => c.char === char);
    if (!charData) {
      return { 'border-bottom': '3px solid #999999' }; // Grey for unknown
    }

    if (charData.known) {
      return { 'border-bottom': '3px solid #2e7d32' }; // Green for known
    } else {
      return { 'border-bottom': '3px solid #999999' }; // Grey for unknown
    }
  }
}
