import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SentenceFlashcardService, SentenceDTO } from '../../services/sentence-flashcard.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sentence-flashcard',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
  templateUrl: './sentence-flashcard.component.html',
  styleUrls: ['./sentence-flashcard.component.scss'],
})
export class SentenceFlashcardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sceneVideo', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

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

  // Video timing state
  isVideoPlaying = false;
  isVideoReady = false;
  isWaitingForUserInput = false;
  canRevealAnswer = false;
  sentencePlaybackCompleted = false;

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
    private sentenceFlashcardService: SentenceFlashcardService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  ngAfterViewInit() {
    this.initializeVideoPlayer();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.removeVideoEventListeners();
  }

  // ===== VIDEO INITIALIZATION =====

  private initializeVideoPlayer() {
    if (!this.videoElement) return;
    console.log('init video player');

    const video = this.videoElement.nativeElement;

    // Wait for video to load
    video.addEventListener('loadedmetadata', () => {
      this.isVideoReady = true;
      console.log('Video loaded and ready');
    });

    video.addEventListener('ended', () => {
      this.isVideoPlaying = false;
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

  private playVideoForCurrentSentence(fromBeginning: boolean = false) {
    if (!this.videoElement || !this.currentSentence || !this.currentSentence.startMs) return;

    const video = this.videoElement.nativeElement;

    // Set video to start time of current sentence
    console.log(this.currentSentence);
    if (fromBeginning) {
      video.currentTime = 0;
    } else {
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
        if (!this.currentSentence) return;
        this.isVideoPlaying = true;
        console.log(
          `Playing sentence ${this.currentSentence.id} from ${this.currentSentence.startMs}ms to ${this.currentSentence.endMs}ms`
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
        this.sceneSentences = response.sentences;
        this.reviewStats.total = response.total;
        this.isLoading = false;
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
    console.log('this.sceneSentences', this.sceneSentences);
    // Reset review state
    this.selectedRating = null;
    this.isFlipped = false;
    this.sentencePlaybackCompleted = false;
    this.isWaitingForUserInput = false;
    this.canRevealAnswer = false;

    if (this.sceneSentences.length > 0) {
      const isFirstSentence = !this.currentSentence;
      this.currentSentence = this.sceneSentences.shift() || null;
      this.reviewStats.current = this.reviewStats.total - this.sceneSentences.length;
      this.isReviewing = true;
      this.isProcessingReview = false;

      // Wait a moment for UI to update, then start video playback
      setTimeout(() => {
        if (this.isVideoReady) {
          this.playVideoForCurrentSentence(isFirstSentence);
        }
      }, 500);
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
}
