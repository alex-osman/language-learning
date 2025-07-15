import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SentenceFlashcardService, SentenceDTO } from '../../services/sentence-flashcard.service';
import {
  SentenceAnalysisService,
  AnalyzedCharacter,
  SentenceAnalysisResult,
} from '../../services/sentence-analysis.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import { CharacterAnalysisComponent } from '../character-analysis/character-analysis.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sentence-flashcard',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent, CharacterAnalysisComponent],
  templateUrl: './sentence-flashcard.component.html',
  styleUrls: ['./sentence-flashcard.component.scss'],
})
export class SentenceFlashcardComponent implements OnInit, OnDestroy, AfterViewInit {
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
  sceneSentences: SentenceDTO[] = [];
  currentSentence: SentenceDTO | null = null;
  isFlipped = false;
  isLoading = true;
  isReviewing = false;
  isProcessingReview = false;
  selectedRating: number | null = null;
  error: string | null = null;
  reviewCompleted = false;

  title: string = '';
  assetUrl: string = '';

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

  // Scene context (required)
  sceneId: string = '';
  mediaId: string = '';
  seasonId: string = '';
  episodeId: string = '';

  // Review stats
  reviewStats = {
    total: 0,
    current: 0,
    correct: 0,
    incorrect: 0,
  };

  // Template helpers
  Math = Math;

  private subscriptions: Subscription[] = [];
  private videoTimeUpdateListener?: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sentenceFlashcardService: SentenceFlashcardService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  ngAfterViewInit() {
    // View initialised; actual video player setup happens once the element is available via the setter above.
    console.log('ngAfterViewInit');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.removeVideoEventListeners();
  }

  // ===== VIDEO INITIALIZATION =====

  private initializeVideoPlayer() {
    console.log('initializeVideoPlayer');
    if (!this.videoElement) {
      console.log('no video element');
      return;
    }
    console.log('videoElement', this.videoElement);

    const video = this.videoElement.nativeElement;
    console.log('video', video);

    // Wait for video to load
    video.addEventListener('loadedmetadata', () => {
      console.log('Video loaded metadata');
      this.isVideoReady = true;
      video.pause(); // Start paused
      console.log('Video loaded and ready');
    });

    video.addEventListener('ended', () => {
      this.isVideoPlaying = false;
      // If video ends naturally (especially on last sentence), trigger reveal state
      if (this.currentSentence && !this.canRevealAnswer) {
        this.pauseVideoAtSentenceEnd();
      }
      console.log('Video ended');
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
    if (!this.currentSentence || !this.videoElement) return;

    const video = this.videoElement.nativeElement;
    const currentTimeMs = video.currentTime * 1000;

    // Check if we've reached the end of the current sentence
    if (currentTimeMs >= this.currentSentence.endMs! && this.isVideoPlaying) {
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

    console.log('Video paused at sentence end');
  }

  private playVideoForCurrentSentence() {
    if (!this.videoElement || !this.currentSentence) return;

    const video = this.videoElement.nativeElement;

    // Set video to start time of current sentence
    if (this.currentSentence.startMs) {
      video.currentTime = this.currentSentence.startMs / 1000;
    }

    // Reset states
    this.sentencePlaybackCompleted = false;
    this.isWaitingForUserInput = false;
    this.canRevealAnswer = false;
    this.isFlipped = false;

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
  }

  // ===== INITIALIZATION =====

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.sceneId = params['sceneId'] || '';

      // Get additional context from query parameters if provided
      this.route.queryParams.subscribe(queryParams => {
        this.mediaId = queryParams['mediaId'] || '';
        this.seasonId = queryParams['seasonId'] || '';
        this.episodeId = queryParams['episodeId'] || '';
      });

      if (this.sceneId) {
        this.loadSceneSentences();
      } else {
        this.error = 'Scene ID is required for sentence practice.';
        this.isLoading = false;
      }
    });
  }

  // ===== DATA LOADING =====

  public loadSceneSentences() {
    this.isLoading = true;
    this.error = null;

    const sub = this.sentenceFlashcardService.getSentencesForScene(this.sceneId).subscribe({
      next: response => {
        this.title = response.title;
        this.assetUrl = response.assetUrl;
        this.sceneSentences = response.sentences.map((sentence, index) => {
          if (!index) {
            return {
              ...sentence,
              startMs: 0,
            };
          }
          return sentence;
        });
        this.reviewStats.total = response.total;
        this.isLoading = false;
        console.log('Loaded scene sentences', this.sceneSentences);
        this.showNextSentence();
      },
      error: err => {
        console.error('Error loading scene sentences:', err);
        this.error = 'Failed to load sentences for this scene. Please try again.';
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

    if (this.sceneSentences.length > 0) {
      console.log('Showing next sentence', this.sceneSentences);
      this.currentSentence = this.sceneSentences.shift() || null;
      this.reviewStats.current = this.reviewStats.total - this.sceneSentences.length;
      this.isReviewing = true;
      this.isProcessingReview = false;

      // Wait a moment for UI to update, then start video playback
      setTimeout(() => {
        this.playVideoForCurrentSentence();
      }, 1000);
    } else {
      // All sentences completed
      this.currentSentence = null;
      this.isReviewing = false;
      this.reviewCompleted = true;
      this.isProcessingReview = false;
      this.isVideoPlaying = false;
    }
  }

  // ===== USER INTERACTIONS =====

  revealAnswer() {
    console.log('revealAnswer', this.canRevealAnswer, this.isProcessingReview);
    if (!this.canRevealAnswer || this.isProcessingReview) return;

    this.isFlipped = true;
    this.isWaitingForUserInput = false;

    // TODO: Play audio when revealing answer
    // this.playAudio();
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

  // ===== NAVIGATION =====

  goBackToScene() {
    this.router.navigate([
      `/media/${this.mediaId}/seasons/${this.seasonId}/episodes/${this.episodeId}/scenes/${this.sceneId}`,
    ]);
  }

  // ===== AUDIO PLAYBACK =====

  playAudio() {
    // TODO: Implement audio playback
    console.log('Playing audio for sentence:', this.currentSentence?.sentence);
  }

  // ===== CHARACTER ANALYSIS =====

  analyzeSentence() {
    if (!this.currentSentence || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.analysisError = null;

    const sub = this.sentenceAnalysisService
      .analyzeSentence(this.currentSentence.sentence)
      .subscribe({
        next: (analysis: SentenceAnalysisResult) => {
          this.analysisResults = analysis.all_characters;
          this.analysisStats = {
            totalCharacters: analysis.total_characters,
            knownCharacters: analysis.known_count,
            unknownCharacters: analysis.unknown_count,
            knownPercentage: analysis.known_percent,
          };
          this.showAnalysis = true;
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
      this.analyzeSentence();
    }
  }

  closeAnalysis() {
    this.showAnalysis = false;
  }
}
