import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../services/movie.service';
import { CharacterDTO } from '../../services/data.service';
import { TONES_MAPPED_TO_LOCATION } from '@shared/types/languages';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.scss',
})
export class LearningComponent implements OnInit {
  currentCharacter: CharacterDTO | null = null;
  userMovie: string = '';
  generatedImageUrl: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  isGeneratingImage: boolean = false;
  radicalsInput: string = '';
  isSavingRadicals: boolean = false;

  constructor(private movieService: MovieService) {}

  ngOnInit() {
    this.loadNextCharacter();
  }

  loadNextCharacter() {
    this.isLoading = true;
    this.userMovie = '';
    this.generatedImageUrl = '';
    this.radicalsInput = '';

    this.movieService.getNextCharacterForMovie().subscribe({
      next: character => {
        this.currentCharacter = character;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading next character:', err);
        this.isLoading = false;
      },
    });
  }

  generateImage() {
    if (!this.userMovie || !this.currentCharacter?.id) return;

    this.isGeneratingImage = true;
    this.movieService.generateMovieImage(this.currentCharacter.id, this.userMovie).subscribe({
      next: response => {
        this.generatedImageUrl = response.imageUrl;
        this.isGeneratingImage = false;
      },
      error: err => {
        console.error('Error generating image:', err);
        this.isGeneratingImage = false;
      },
    });
  }

  saveMovie() {
    if (!this.currentCharacter || !this.userMovie) return;

    this.isSaving = true;
    this.movieService
      .saveCharacterMovie(this.currentCharacter.id, this.userMovie, this.generatedImageUrl)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.loadNextCharacter(); // Move to next character
        },
        error: err => {
          console.error('Error saving movie:', err);
          this.isSaving = false;
        },
      });
  }

  saveRadicals() {
    if (!this.currentCharacter || !this.radicalsInput) return;

    this.isSavingRadicals = true;
    this.movieService
      .updateCharacterRadicals(this.currentCharacter.id, this.radicalsInput)
      .subscribe({
        next: updatedCharacter => {
          this.currentCharacter = updatedCharacter;
          this.radicalsInput = '';
          this.isSavingRadicals = false;
        },
        error: err => {
          console.error('Error saving radicals:', err);
          this.isSavingRadicals = false;
        },
      });
  }

  getToneName(toneNumber: number): string {
    return (
      this.currentCharacter?.finalSet?.toneLocations?.[toneNumber]?.name ||
      TONES_MAPPED_TO_LOCATION[toneNumber as unknown as keyof typeof TONES_MAPPED_TO_LOCATION]
    );
  }
}
