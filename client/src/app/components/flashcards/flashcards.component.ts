import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashcardService } from '../../services/flashcard.service';
import { CharacterDTO } from '../../services/data.service';
import { PinyinService } from '../../services/pinyin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcards.component.html',
  styleUrls: ['./flashcards.component.scss'],
})
export class FlashcardsComponent implements OnInit, OnDestroy {
  dueCards: CharacterDTO[] = [];
  currentCard: CharacterDTO | null = null;
  isFlipped = false;
  isLoading = true;
  isReviewing = false;
  isProcessingReview = false;
  selectedRating: number | null = null;
  error: string | null = null;
  reviewCompleted = false;
  reviewStats = {
    total: 0,
    totalDue: 0,
    correct: 0,
    incorrect: 0,
  };

  // Touch gesture variables
  touchStartX: number = 0;
  touchEndX: number = 0;
  private subscriptions: Subscription[] = [];
  private audioIsPlayingTimeout: any;

  constructor(private flashcardService: FlashcardService, private pinyinService: PinyinService) {}

  ngOnInit() {
    this.loadDueCards();
    this.detectMobile();
  }

  ngOnDestroy() {
    // Clear all subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Clear any pending timeouts
    if (this.audioIsPlayingTimeout) {
      clearTimeout(this.audioIsPlayingTimeout);
    }
  }

  // Detect if user is on mobile device to adjust UX
  private detectMobile() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      document.body.classList.add('touch-device');
    }
  }

  // Handle swipe gestures for mobile
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const SWIPE_THRESHOLD = 50; // Minimum distance required for a swipe

    // Don't process swipes during review submission
    if (this.isProcessingReview) return;

    // Swipe left (next card)
    if (this.touchEndX < this.touchStartX - SWIPE_THRESHOLD && this.isFlipped) {
      // Only allow swiping to next card when current card is flipped
      this.submitReview(3); // Default to "medium" difficulty
    }

    // Swipe right (flip card)
    if (this.touchEndX > this.touchStartX + SWIPE_THRESHOLD && !this.isFlipped) {
      this.flipCard();
    }
  }

  loadDueCards() {
    this.isLoading = true;
    this.error = null;

    const sub = this.flashcardService.getDueCards().subscribe({
      next: response => {
        this.dueCards = response.characters;
        this.reviewStats.totalDue = response.characters.length;
        this.reviewStats.total = response.total;
        this.isLoading = false;
        this.showNextCard();
      },
      error: err => {
        console.error('Error loading due cards:', err);
        this.error = 'Failed to load cards for review. Please try again.';
        this.isLoading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  showNextCard() {
    // Reset review state
    this.selectedRating = null;

    // Set isFlipped to false BEFORE setting currentCard to ensure
    // the next card is always shown front-side first
    this.isFlipped = false;

    if (this.dueCards.length > 0) {
      // Use setTimeout to ensure card animation happens after the isFlipped state change
      setTimeout(() => {
        this.currentCard = this.dueCards.shift() || null;
        this.isReviewing = true;
        this.isProcessingReview = false;
      }, 300);
    } else {
      this.isProcessingReview = false;
      this.currentCard = null;
      this.isReviewing = false;
      this.reviewCompleted = true;
    }
  }

  flipCard() {
    // Don't allow flipping during review submission
    if (this.isProcessingReview) return;

    this.isFlipped = !this.isFlipped;

    // Play pronunciation when card is flipped to reveal answer
    // Add a slight delay to match the animation timing
    if (this.isFlipped && this.currentCard) {
      setTimeout(() => {
        this.playAudio(this.currentCard!);
      }, 300); // Half the animation time (600ms/2) to sync with the card flip
    }
  }

  submitReview(quality: number) {
    if (!this.currentCard || this.isProcessingReview) return;

    // Immediately set processing state to prevent double submissions
    this.isProcessingReview = true;
    this.selectedRating = quality;

    // Update stats
    if (quality >= 3) {
      this.reviewStats.correct++;
    } else {
      this.reviewStats.incorrect++;
    }

    const sub = this.flashcardService.reviewCard(this.currentCard.id, quality).subscribe({
      next: () => {
        // Add a short delay before transitioning to the next card
        // This gives time for the user to see their selection
        setTimeout(() => {
          this.showNextCard();
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

  startLearning(characterId: number) {
    const sub = this.flashcardService.startLearning(characterId).subscribe({
      next: () => {
        this.loadDueCards();
      },
      error: err => {
        console.error('Error starting learning:', err);
        this.error = 'Failed to start learning this character. Please try again.';
      },
    });

    this.subscriptions.push(sub);
  }

  resetReview() {
    this.reviewCompleted = false;
    this.reviewStats = {
      total: 0,
      totalDue: 0,
      correct: 0,
      incorrect: 0,
    };
    this.loadDueCards();
  }

  playAudio(character: CharacterDTO) {
    if (!character.pinyin) return;

    try {
      // Get audio URLs for each syllable in the pinyin
      const audioUrls = this.pinyinService.getAudioUrls(character.pinyin);

      // Play each syllable in sequence
      for (const url of audioUrls) {
        this.pinyinService.playAudioFile(url);
      }

      // Visual feedback that audio is playing
      document.body.classList.add('audio-playing');

      // Remove class after 2 seconds
      this.audioIsPlayingTimeout = setTimeout(() => {
        document.body.classList.remove('audio-playing');
      }, 2000);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
}
