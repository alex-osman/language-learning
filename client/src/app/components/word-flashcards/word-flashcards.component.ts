import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordFlashcardService, FlashWordDTO } from '../../services/word-flashcard.service';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-word-flashcards',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent],
  templateUrl: './word-flashcards.component.html',
  styleUrls: ['./word-flashcards.component.scss'],
})
export class WordFlashcardsComponent implements OnInit, OnDestroy {
  dueCards: FlashWordDTO[] = [];
  currentCard: FlashWordDTO | null = null;
  isFlipped = false;
  isLoading = true;
  isProcessingReview = false;
  selectedRating: number | null = null;
  error: string | null = null;

  reviewedCount = 0;
  totalDue = 0;

  private subscriptions: Subscription[] = [];

  readonly ratingLabels: { label: string; cssClass: string }[] = [
    { label: 'Blackout', cssClass: 'bad' },
    { label: 'Wrong', cssClass: 'bad' },
    { label: 'Hard', cssClass: 'bad' },
    { label: 'Okay', cssClass: 'ok' },
    { label: 'Good', cssClass: 'good' },
    { label: 'Perfect', cssClass: 'perfect' },
  ];

  constructor(private wordFlashcardService: WordFlashcardService) {}

  ngOnInit() {
    this.loadDueCards();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadDueCards() {
    this.isLoading = true;
    this.error = null;

    const sub = this.wordFlashcardService.getDueCards().subscribe({
      next: (cards) => {
        this.dueCards = this.shuffle(cards);
        this.totalDue = cards.length;
        this.reviewedCount = 0;
        this.isLoading = false;
        this.showNextCard();
      },
      error: (err) => {
        console.error('Error loading due word cards:', err);
        this.error = 'Failed to load cards for review. Please try again.';
        this.isLoading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  showNextCard() {
    this.selectedRating = null;
    this.isFlipped = false;

    if (this.dueCards.length > 0) {
      setTimeout(() => {
        this.currentCard = this.dueCards.shift() ?? null;
        this.isProcessingReview = false;
      }, 300);
    } else {
      this.isProcessingReview = false;
      this.currentCard = null;
    }
  }

  flipCard() {
    if (this.isProcessingReview) return;
    this.isFlipped = !this.isFlipped;
  }

  submitReview(quality: number) {
    if (!this.currentCard || this.isProcessingReview) return;

    this.isProcessingReview = true;
    this.selectedRating = quality;

    const sub = this.wordFlashcardService.reviewCard(this.currentCard.wordId, quality).subscribe({
      next: () => {
        this.reviewedCount++;
        setTimeout(() => {
          this.showNextCard();
        }, 600);
      },
      error: (err) => {
        console.error('Error submitting word review:', err);
        this.error = 'Failed to submit review. Please try again.';
        this.isProcessingReview = false;
      },
    });

    this.subscriptions.push(sub);
  }

  get progressPercent(): number {
    if (this.totalDue === 0) return 100;
    return (this.reviewedCount / this.totalDue) * 100;
  }

  get isDone(): boolean {
    return !this.isLoading && !this.error && this.currentCard === null && this.totalDue >= 0;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
