import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Character, MovieScene, Tone } from '../../services/data.service';
import { MovieService, MovieGenerationRequest } from '../../services/movie.service';
import { RadicalProp } from 'src/app/interfaces/mandarin-blueprint.interface';
import { PinyinService } from '../../services/pinyin.service';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
})
export class CharactersComponent implements OnInit {
  characters: Character[] = [];
  selectedCharacter: Character | null = null;
  movieScene: MovieScene | null = null;
  isLoading = true;
  isGeneratingMovie = false;
  isPlayingAudio = false;
  error: string | null = null;
  tones: Tone | null = null;
  radicalProps: RadicalProp[] = [];

  constructor(
    private dataService: DataService,
    private movieService: MovieService,
    private pinyinService: PinyinService
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
      this.isLoading = false;
    });
  }

  private loadTones() {
    this.dataService.getTones().subscribe(tones => {
      this.tones = tones;
    });
  }

  hasCharacterData(char: Character): boolean {
    return !!(char.pinyin && char.definition);
  }

  async onCharacterClick(char: Character) {
    if (!char.pinyin) return;

    this.selectedCharacter = char;
    this.movieScene = await this.dataService.getMovieScene(char.pinyin);
  }

  clearSelection(): void {
    this.selectedCharacter = null;
    this.movieScene = null;
  }

  generateMovie(): void {
    if (!this.selectedCharacter || !this.movieScene) return;

    this.isGeneratingMovie = true;

    const request: MovieGenerationRequest = {
      character: this.selectedCharacter.character,
      pinyin: this.selectedCharacter.pinyin || '',
      definition: this.selectedCharacter.definition || '',
      actor: this.movieScene.actor,
      set: this.movieScene.set,
      tone: this.movieScene.tone,
      toneLocation: this.movieScene.tone,
      radicalProps: this.getRadicalProps(this.selectedCharacter.radicals),
    };

    this.movieService.generateMovie(request).subscribe({
      next: response => {
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
        this.isGeneratingMovie = false;
      },
      error: error => {
        console.error('Error generating movie:', error);
        this.isGeneratingMovie = false;
        this.error = 'Failed to generate movie. Please try again.';
      },
    });
  }

  public getRadicalProps(props?: string[]): RadicalProp[] {
    if (!props) return [];

    return props.map(
      radical => this.radicalProps.find(prop => prop.radical === radical) || { radical, prop: '' }
    );
  }

  async playCharacterAudio(char: Character) {
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

  /**
   * Debug method to verify audio URLs are correctly formatted
   * This can be accessed from the browser console using:
   * angular.getComponent($0).debugAudioUrls('nǐhǎo')
   */
  debugAudioUrls(pinyin: string): void {
    console.log('Debug Audio URLs for:', pinyin);
    try {
      const audioUrls = this.pinyinService.getAudioUrls(pinyin);
      console.log('Generated Audio URLs:', audioUrls);

      // Try to check if URLs are accessible
      audioUrls.forEach(url => {
        fetch(url, { method: 'HEAD' })
          .then(response => {
            console.log(
              `URL ${url} is ${response.ok ? 'accessible' : 'not accessible'} (${response.status})`
            );
          })
          .catch(error => {
            console.error(`Error checking URL ${url}:`, error);
          });
      });
    } catch (error) {
      console.error('Error generating audio URLs:', error);
    }
  }
}
