import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterDTO } from '../../services/data.service';
import { EasinessColorService } from '../../services/easiness-color.service';
import { FlashcardService } from '../../services/flashcard.service';
import { MovieService } from '../../services/movie.service';
import { PinyinService } from '../../services/pinyin.service';

// Supporting Types for Sorting and Filtering
type SortOption =
  | 'id'
  | 'frequency'
  | 'difficulty'
  | 'learnedDate'
  | 'dueStatus'
  | 'character'
  | 'pinyin';

type LearningFilter = 'all' | 'learned' | 'notLearned' | 'seen';

// NEW: Character knowledge status enum
enum CharacterKnowledgeStatus {
  UNKNOWN = 'unknown',
  SEEN = 'seen',
  LEARNING = 'learning',
  LEARNED = 'learned',
}

@Component({
  selector: 'app-character-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-explorer.component.html',
  styleUrls: ['./character-explorer.component.scss'],
})
export class CharacterExplorerComponent implements OnInit {
  @Input() characters: CharacterDTO[] = [];
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() title = 'Characters';
  @Input() showStats = true;
  @Input() showSorting = true;
  @Input() showFilters = true;
  @Input() compact = false;
  @Input() mode: 'explorer' | 'analysis' | 'episode' = 'explorer';
  @Input() showActions = true;
  @Input() showLearningButtons = true;
  @Input() showMovieGeneration = true;
  @Input() showMovie = false;
  @Input() collapsed = false;

  // Internal state
  selectedCharacter: CharacterDTO | null = null;
  filteredCharacters: CharacterDTO[] = [];

  // Sorting and filtering state
  sortBy: SortOption = 'difficulty';
  sortDirection: 'asc' | 'desc' = 'asc';
  learningFilter: LearningFilter = 'all';

  // UI state
  isGeneratingMovie = false;
  isPlayingAudio = false;
  isStartingLearning = false;
  isMarkingAsSeen = false; // NEW: Loading state for marking as seen
  userStoryInput: string = '';
  generatedImageUrl: string | null = null;

  // Template helpers
  Math = Math;

  constructor(
    private movieService: MovieService,
    private pinyinService: PinyinService,
    private flashcardService: FlashcardService,
    private easinessColorService: EasinessColorService
  ) {}

  ngOnInit() {
    this.updateFilteredCharacters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['characters']) {
      this.updateFilteredCharacters();
    }
  }

  // Computed properties
  get learnedCharactersCount(): number {
    return this.characters.filter(
      char => this.getCharacterKnowledgeStatus(char) === CharacterKnowledgeStatus.LEARNED
    ).length;
  }

  get seenCharactersCount(): number {
    return this.characters.filter(
      char => this.getCharacterKnowledgeStatus(char) === CharacterKnowledgeStatus.SEEN
    ).length;
  }

  get unknownCharactersCount(): number {
    return this.characters.filter(
      char => this.getCharacterKnowledgeStatus(char) === CharacterKnowledgeStatus.UNKNOWN
    ).length;
  }

  // Updated: Legacy method for backward compatibility
  get knownCharactersCount(): number {
    return this.characters.filter(char => !!char.lastReviewDate).length;
  }

  // Character interaction methods (reused from CharactersComponent)
  onCharacterClick(char: CharacterDTO) {
    if (!this.showMovie) return this.playCharacterAudio(char);
    if (!char.pinyin) return;
    this.selectedCharacter = char;
    return;
  }

  clearSelection(): void {
    this.selectedCharacter = null;
    this.generatedImageUrl = null;
  }

  generateMovie(): void {
    if (!this.selectedCharacter) return;

    this.isGeneratingMovie = true;
    this.generatedImageUrl = null;

    this.movieService.generateMovie(this.selectedCharacter.id, this.userStoryInput).subscribe({
      next: response => {
        console.log('Movie generated:', response);
        if (this.selectedCharacter) {
          // Update the character's movie property
          const charIndex = this.characters.findIndex(
            c => c.character === this.selectedCharacter?.character
          );
          if (charIndex !== -1) {
            this.characters[charIndex].movie = response.movie;
            this.selectedCharacter.movie = response.movie;
          }
        }

        // Store the generated image URL if available
        if (response.imageUrl) {
          console.log('Image URL received:', response.imageUrl);
          this.generatedImageUrl = response.imageUrl;
        }

        // Reset the user input after successful generation
        this.userStoryInput = '';
        this.isGeneratingMovie = false;
      },
      error: error => {
        console.error('Error generating movie:', error);
        this.isGeneratingMovie = false;
        this.error = 'Failed to generate movie. Please try again.';
      },
    });
  }

  async playCharacterAudio(char: CharacterDTO) {
    if (!char.pinyin) return;

    this.isPlayingAudio = true;
    try {
      console.log('Playing audio for:', char.character, char.pinyin);

      // Get audio URLs for each syllable in the pinyin
      const audioUrl = this.pinyinService.getAudioUrl(char.pinyin);
      console.log('Audio URLs:', audioUrl);

      // Play each syllable in sequence
      console.log('Playing syllable URL:', audioUrl);
      await this.pinyinService.playAudioFile(audioUrl);

      console.log('Finished playing audio');
    } catch (error) {
      console.error('Error playing audio:', error);
      this.error = 'Failed to play audio. Please try again.';
    } finally {
      this.isPlayingAudio = false;
    }
  }

  stopAudio() {
    this.pinyinService.stop();
    this.isPlayingAudio = false;
  }

  startLearning(): void {
    if (!this.selectedCharacter) return;

    this.isStartingLearning = true;

    this.flashcardService.startLearning(this.selectedCharacter.id).subscribe({
      next: response => {
        console.log('Character added to learning:', response);
        // Update the character's learning info in the local array
        const charIndex = this.characters.findIndex(c => c.id === this.selectedCharacter?.id);
        if (charIndex !== -1) {
          this.characters[charIndex] = response;
          this.selectedCharacter = response;
        }
        // Update filtered characters since learning status changed
        this.updateFilteredCharacters();
        this.isStartingLearning = false;
      },
      error: error => {
        console.error('Error starting learning:', error);
        this.isStartingLearning = false;
        this.error = 'Failed to add character to learning. Please try again.';
      },
    });
  }

  // NEW: Mark character as seen
  markCharacterAsSeen(): void {
    if (!this.selectedCharacter) return;

    this.isMarkingAsSeen = true;

    // Pass episode context if available (could be enhanced to pass actual episode info)
    const context = this.mode === 'episode' ? { movie: 'Episode Context' } : undefined;

    this.flashcardService.markCharacterAsSeen(this.selectedCharacter.id, context).subscribe({
      next: response => {
        console.log('Character marked as seen:', response);
        // Update the character's seen status in the local array
        const charIndex = this.characters.findIndex(c => c.id === this.selectedCharacter?.id);
        if (charIndex !== -1) {
          this.characters[charIndex] = response;
          this.selectedCharacter = response;
        }
        // Update filtered characters since seen status changed
        this.updateFilteredCharacters();
        this.isMarkingAsSeen = false;
      },
      error: error => {
        console.error('Error marking character as seen:', error);
        this.isMarkingAsSeen = false;
        this.error = 'Failed to mark character as seen. Please try again.';
      },
    });
  }

  // NEW: Mark character as seen from card (without opening modal)
  markCharacterAsSeenFromCard(char: CharacterDTO): void {
    if (!char || !this.canMarkAsSeen(char)) return;

    this.isMarkingAsSeen = true;

    // Pass episode context if available (could be enhanced to pass actual episode info)
    const context = this.mode === 'episode' ? { movie: 'Episode Context' } : undefined;

    this.flashcardService.markCharacterAsSeen(char.id, context).subscribe({
      next: response => {
        console.log('Character marked as seen:', response);
        // Update the character's seen status in the local array
        const charIndex = this.characters.findIndex(c => c.id === char.id);
        if (charIndex !== -1) {
          this.characters[charIndex] = response;
          // Also update selectedCharacter if it's the same character
          if (this.selectedCharacter?.id === char.id) {
            this.selectedCharacter = response;
          }
        }
        // Update filtered characters since seen status changed
        this.updateFilteredCharacters();
        this.isMarkingAsSeen = false;
      },
      error: error => {
        console.error('Error marking character as seen:', error);
        this.isMarkingAsSeen = false;
        this.error = 'Failed to mark character as seen. Please try again.';
      },
    });
  }

  // NEW: Get character knowledge status
  getCharacterKnowledgeStatus(char: CharacterDTO): CharacterKnowledgeStatus {
    if (char.lastReviewDate) {
      // Has been reviewed = learning or learned
      const isLearned = (char.repetitions || 0) >= 3 && (char.easinessFactor || 2.5) >= 2.0;
      return isLearned ? CharacterKnowledgeStatus.LEARNED : CharacterKnowledgeStatus.LEARNING;
    }

    if (char.firstSeenDate) {
      return CharacterKnowledgeStatus.SEEN;
    }

    return CharacterKnowledgeStatus.UNKNOWN;
  }

  // NEW: Check if character can be marked as seen (unknown characters only)
  canMarkAsSeen(char: CharacterDTO): boolean {
    const status = this.getCharacterKnowledgeStatus(char);
    return status === CharacterKnowledgeStatus.UNKNOWN;
  }

  // Sorting and filtering methods (reused from CharactersComponent)
  private applySorting(characters: CharacterDTO[]): CharacterDTO[] {
    return characters.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'frequency':
          const aFreq = a.freq || Infinity;
          const bFreq = b.freq || Infinity;
          comparison = aFreq - bFreq;
          break;

        case 'difficulty':
          const aEase = a.easinessFactor || 0;
          const bEase = b.easinessFactor || 0;
          comparison = aEase - bEase;
          break;

        case 'learnedDate':
          const aDate = a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0;
          const bDate = b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0;
          comparison = bDate - aDate;
          break;

        case 'dueStatus':
          // Due for review first, then by next review date
          if (a.dueForReview && !b.dueForReview) return -1;
          if (!a.dueForReview && b.dueForReview) return 1;

          const aNext = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : Infinity;
          const bNext = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : Infinity;
          comparison = aNext - bNext;
          break;

        case 'character':
          comparison = a.id - b.id;
          break;

        case 'pinyin':
          const aPinyin = a.pinyin || '';
          const bPinyin = b.pinyin || '';
          comparison = aPinyin.localeCompare(bPinyin);
          break;

        case 'id':
        default:
          comparison = a.id - b.id;
          break;
      }

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  private applyFilters(characters: CharacterDTO[]): CharacterDTO[] {
    return characters.filter(char => {
      const status = this.getCharacterKnowledgeStatus(char);

      switch (this.learningFilter) {
        case 'learned':
          return status === CharacterKnowledgeStatus.LEARNED;
        case 'seen':
          return status === CharacterKnowledgeStatus.SEEN;
        case 'notLearned':
          return status === CharacterKnowledgeStatus.UNKNOWN;
        case 'all':
        default:
          return true;
      }
    });
  }

  private updateFilteredCharacters(): void {
    let filtered = this.applyFilters(this.characters);
    this.filteredCharacters = this.applySorting(filtered);
  }

  // Public methods for UI to trigger sorting/filtering changes
  onSortByChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value as SortOption;
    this.updateFilteredCharacters();
  }

  onSortDirectionToggle(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.updateFilteredCharacters();
  }

  onLearningFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.learningFilter = target.value as LearningFilter;
    this.updateFilteredCharacters();
  }

  onResetFilters(): void {
    this.sortBy = 'id';
    this.sortDirection = 'desc';
    this.learningFilter = 'all';
    this.updateFilteredCharacters();
  }

  // Easiness color methods (reused from CharactersComponent)
  getEasinessGradientStyle(char: CharacterDTO): { [key: string]: string } {
    if (char.repetitions === 0 && char.interval === 0) {
      return {
        'background-color': '#e0e0e0',
        'border-color': '#bdbdbd',
      };
    }
    return this.easinessColorService.getGradientStyles(char.easinessFactor);
  }

  getEasinessTextStyle(char: CharacterDTO): { [key: string]: string } {
    if (char.repetitions === 0 && char.interval === 0) {
      return {
        color: '#757575',
      };
    }
    return this.easinessColorService.getTextColor(char.easinessFactor);
  }

  // Helper methods for UI display
  getSortOptionLabel(sortBy: SortOption): string {
    const labels: Record<SortOption, string> = {
      id: 'Creation Order',
      frequency: 'Frequency',
      difficulty: 'Difficulty',
      learnedDate: 'Learned Date',
      dueStatus: 'Due Status',
      character: 'Character (A-Z)',
      pinyin: 'Pinyin (A-Z)',
    };
    return labels[sortBy];
  }

  getSortDirectionLabel(): string {
    if (this.sortBy === 'frequency') {
      return this.sortDirection === 'asc' ? 'Most Common First' : 'Least Common First';
    }
    if (this.sortBy === 'difficulty') {
      return this.sortDirection === 'asc' ? 'Easiest First' : 'Hardest First';
    }
    if (this.sortBy === 'learnedDate') {
      return this.sortDirection === 'desc' ? 'Recently Learned First' : 'Oldest Learned First';
    }
    return this.sortDirection === 'desc' ? 'Descending' : 'Ascending';
  }

  // Helper method to check if character has data
  hasCharacterData(char: CharacterDTO): boolean {
    return !!(char.pinyin && char.definition);
  }

  // Helper method for tone location display
  getToneLocation(character: CharacterDTO): string {
    const toneLocation = character.finalSet?.toneLocations.find(
      toneLocation => toneLocation.toneNumber === character.toneNumber
    );
    if (toneLocation) return toneLocation.name;

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
}
