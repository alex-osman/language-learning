import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, CharacterDTO, MovieScene, Tone } from '../../services/data.service';
import { MovieService, MovieGenerationRequest } from '../../services/movie.service';
import { RadicalProp } from 'src/app/interfaces/mandarin-blueprint.interface';
import { PinyinService } from '../../services/pinyin.service';
import { FlashcardService } from '../../services/flashcard.service';
import { EasinessColorService } from '../../services/easiness-color.service';

// Supporting Types for Sorting and Filtering
type SortOption =
  | 'id'
  | 'frequency'
  | 'difficulty'
  | 'learnedDate'
  | 'dueStatus'
  | 'character'
  | 'pinyin';
type LearningFilter = 'all' | 'learned' | 'notLearned';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
})
export class CharactersComponent implements OnInit {
  characters: CharacterDTO[] = [];
  selectedCharacter: CharacterDTO | null = null;
  movieScene: MovieScene | null = null;
  isLoading = true;
  isGeneratingMovie = false;
  isPlayingAudio = false;
  isStartingLearning = false;
  error: string | null = null;
  tones: Tone | null = null;
  radicalProps: RadicalProp[] = [];
  userStoryInput: string = '';
  generatedImageUrl: string | null = null;

  // Sorting and Filtering State
  sortBy: SortOption = 'difficulty';
  sortDirection: 'asc' | 'desc' = 'asc';
  learningFilter: LearningFilter = 'all';
  filteredCharacters: CharacterDTO[] = [];
  knownCharactersCount: number = 0;
  lastIdKnown: number = 0;

  constructor(
    private dataService: DataService,
    private movieService: MovieService,
    private pinyinService: PinyinService,
    private flashcardService: FlashcardService,
    private easinessColorService: EasinessColorService
  ) {}

  ngOnInit() {
    this.loadCharacters();
    this.loadTones();
    this.loadRadicalProps();
  }

  private loadRadicalProps() {
    this.dataService.getRadicalProps().subscribe(radicalProps => {
      this.radicalProps = radicalProps;
    });
  }

  private loadCharacters() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getCharacters().subscribe(characters => {
      this.characters = characters;
      this.knownCharactersCount = characters.filter(char => !!char.lastReviewDate).length;
      this.lastIdKnown = characters
        .filter(char => !!char.lastReviewDate)
        .sort((a, b) => b.id - a.id)[0].id;
      this.updateFilteredCharacters();
      this.isLoading = false;
    });
  }

  private loadTones() {
    this.dataService.getTones().subscribe(tones => {
      this.tones = tones;
    });
  }

  hasCharacterData(char: CharacterDTO): boolean {
    return !!(char.pinyin && char.definition);
  }

  async onCharacterClick(char: CharacterDTO) {
    if (!char.pinyin) return;

    this.selectedCharacter = char;
  }

  clearSelection(): void {
    this.selectedCharacter = null;
    this.movieScene = null;
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

  // Easiness color methods - delegated to service
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

  // Core Sorting and Filtering Logic
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
      switch (this.learningFilter) {
        case 'learned':
          return !!char.lastReviewDate;
        case 'notLearned':
          return !char.lastReviewDate;
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
  onSortByChange(sortBy: SortOption): void {
    this.sortBy = sortBy;
    this.updateFilteredCharacters();
  }

  onSortDirectionToggle(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.updateFilteredCharacters();
  }

  onLearningFilterChange(filter: LearningFilter): void {
    this.learningFilter = filter;
    this.updateFilteredCharacters();
  }

  onResetFilters(): void {
    this.sortBy = 'id';
    this.sortDirection = 'desc';
    this.learningFilter = 'all';
    this.updateFilteredCharacters();
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
}
