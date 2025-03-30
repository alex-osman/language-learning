import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashcardService } from '../../services/flashcard.service';
import { CharacterDTO } from '../../services/data.service';
import { PinyinService } from '../../services/pinyin.service';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcards.component.html',
  styleUrls: ['./flashcards.component.scss'],
})
export class FlashcardsComponent implements OnInit {
  dueCards: CharacterDTO[] = [];
  currentCard: CharacterDTO | null = null;
  isFlipped = false;
  isLoading = true;
  isReviewing = false;
  error: string | null = null;
  reviewCompleted = false;
  reviewStats = {
    total: 0,
    correct: 0,
    incorrect: 0,
  };

  constructor(private flashcardService: FlashcardService, private pinyinService: PinyinService) {}

  ngOnInit() {
    this.loadDueCards();
  }

  loadDueCards() {
    this.isLoading = true;
    this.error = null;

    this.flashcardService.getDueCards().subscribe({
      next: cards => {
        this.dueCards = cards;
        this.reviewStats.total = cards.length;
        this.isLoading = false;
        this.showNextCard();
      },
      error: err => {
        console.error('Error loading due cards:', err);
        this.error = 'Failed to load cards for review. Please try again.';
        this.isLoading = false;
      },
    });
  }

  showNextCard() {
    if (this.dueCards.length > 0) {
      this.isFlipped = false;
      this.currentCard = this.dueCards.shift() || null;
      this.isReviewing = true;
    } else {
      this.currentCard = null;
      this.isReviewing = false;
      this.reviewCompleted = true;
    }
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;

    // Play pronunciation when card is flipped to reveal answer
    if (this.isFlipped && this.currentCard) {
      this.playAudio(this.currentCard);
    }
  }

  submitReview(quality: number) {
    if (!this.currentCard) return;

    // Update stats
    if (quality >= 3) {
      this.reviewStats.correct++;
    } else {
      this.reviewStats.incorrect++;
    }

    this.flashcardService.reviewCard(this.currentCard.id, quality).subscribe({
      next: () => {
        this.showNextCard();
      },
      error: err => {
        console.error('Error submitting review:', err);
        this.error = 'Failed to submit review. Please try again.';
      },
    });
  }

  startLearning(characterId: number) {
    this.flashcardService.startLearning(characterId).subscribe({
      next: () => {
        this.loadDueCards();
      },
      error: err => {
        console.error('Error starting learning:', err);
        this.error = 'Failed to start learning this character. Please try again.';
      },
    });
  }

  resetReview() {
    this.reviewCompleted = false;
    this.reviewStats = {
      total: 0,
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
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
}
