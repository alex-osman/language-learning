import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class SentenceFlashcardComponent implements OnInit, OnDestroy {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sentenceFlashcardService: SentenceFlashcardService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    // Reset review state
    this.selectedRating = null;
    this.isFlipped = false;

    if (this.sceneSentences.length > 0) {
      // Use setTimeout to ensure card animation happens after state change
      setTimeout(() => {
        this.currentSentence = this.sceneSentences.shift() || null;
        this.reviewStats.current = this.reviewStats.total - this.sceneSentences.length;
        this.isReviewing = true;
        this.isProcessingReview = false;
      }, 300);
    } else {
      // All sentences completed
      this.currentSentence = null;
      this.isReviewing = false;
      this.reviewCompleted = true;
      this.isProcessingReview = false;
    }
  }

  flipCard() {
    // Don't allow flipping during review submission
    if (this.isProcessingReview) return;

    this.isFlipped = !this.isFlipped;

    // TODO: Add audio playback when card is flipped
    // if (this.isFlipped && this.currentSentence) {
    //   this.playAudio(this.currentSentence);
    // }
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
          }, 600);
        },
        error: err => {
          console.error('Error submitting review:', err);
          this.error = 'Failed to submit review. Please try again.';
          this.isProcessingReview = false;
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
