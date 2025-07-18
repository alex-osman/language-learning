import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashcardService } from '../../services/flashcard.service';
import { CharacterDTO } from '../../services/data.service';
import { PinyinService } from '../../services/pinyin.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
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
  audioEnabled = false;
  reviewCompleted = false;
  showHint = false;
  hintLevel = 0; // 0: no hint, 1: basic hint (actor, location, props), 2: detailed hint (initial, final, tone)
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

  // Get tone location for a character
  getToneLocation(character: CharacterDTO): string {
    // First check if the finalSet has toneLocations with the matching tone number
    const toneLocation = character.finalSet?.toneLocations.find(
      toneLocation => toneLocation.toneNumber === character.toneNumber
    );
    if (toneLocation) return toneLocation.name;

    // Fallback to default locations based on tone number
    return (
      {
        '1': 'Outside the entrance',
        '2': 'Kitchen or inside entrance',
        '3': 'Bedroom or living room',
        '4': 'Bathroom or outside/yard',
        '5': 'On the roof',
      }[character.toneNumber] || 'Unknown'
    );
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

  // Toggle hint visibility and level
  toggleHint(event?: MouseEvent) {
    // Prevent the card from flipping when clicking the hint button
    if (event) {
      event.stopPropagation();
    }

    // Cycle through hint levels: 0 (no hint) -> 1 (basic) -> 2 (detailed) -> 0 (no hint)
    this.hintLevel = (this.hintLevel + 1) % 3;
    this.showHint = this.hintLevel > 0;
  }

  // Get the hint button text based on current hint level
  getHintButtonText(): string {
    switch (this.hintLevel) {
      case 0:
        return 'Show Hint';
      case 1:
        return 'More Details';
      case 2:
        return 'Hide Hint';
      default:
        return 'Show Hint';
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

  /**
   * Load practice cards even when none are due
   * This is triggered when a user wants to practice despite having no due cards
   */
  loadPracticeCards() {
    this.isLoading = true;
    this.error = null;

    const sub = this.flashcardService.getPracticeCards().subscribe({
      next: response => {
        this.dueCards = response.characters;
        this.reviewStats.totalDue = response.characters.length;
        this.reviewStats.total = response.total;
        this.isLoading = false;

        if (this.dueCards.length > 0) {
          this.showNextCard();
        } else {
          this.error =
            'No cards available for practice. Please add characters to your study list first.';
        }
      },
      error: err => {
        console.error('Error loading practice cards:', err);
        this.error = 'Failed to load cards for practice. Please try again.';
        this.isLoading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  showNextCard() {
    // Reset review state
    this.selectedRating = null;
    this.showHint = false;
    this.hintLevel = 0;

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
    }
  }

  flipCard() {
    // Don't allow flipping during review submission
    if (this.isProcessingReview) return;

    this.isFlipped = !this.isFlipped;

    // Play pronunciation when card is flipped to reveal answer
    // Add a slight delay to match the animation timing
    if (this.isFlipped && this.currentCard) {
      if (this.audioEnabled) {
        setTimeout(() => {
          this.playAudio(this.currentCard!);
        }, 300); // Half the animation time (600ms/2) to sync with the card flip
      }
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
      const audioUrl = this.pinyinService.getAudioUrl(character.pinyin);

      // Play each syllable in sequence
      this.pinyinService.playAudioFile(audioUrl);

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
