import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, CharacterDTO, MovieScene, Tone } from '../../services/data.service';
import { MovieService, MovieGenerationRequest } from '../../services/movie.service';
import { RadicalProp } from 'src/app/interfaces/mandarin-blueprint.interface';
import { PinyinService } from '../../services/pinyin.service';
import { FlashcardService } from '../../services/flashcard.service';
import { EasinessColorService } from '../../services/easiness-color.service';

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
      this.characters = characters.sort((a, b) => b.id - a.id);
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
      const audioUrls = this.pinyinService.getAudioUrls(char.pinyin);
      console.log('Audio URLs:', audioUrls);

      // Play each syllable in sequence
      for (const url of audioUrls) {
        console.log('Playing syllable URL:', url);
        await this.pinyinService.playAudioFile(url);
      }

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
}
