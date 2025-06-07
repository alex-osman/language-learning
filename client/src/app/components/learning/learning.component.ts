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
  toneLocation: string = '';
  imagePreviewUrl: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;

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
        this.toneLocation = this.getToneName(this.currentCharacter.toneNumber);
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
      this.currentCharacter?.finalSet?.toneLocations?.find(t => t.toneNumber === toneNumber)
        ?.name ||
      TONES_MAPPED_TO_LOCATION[toneNumber as unknown as keyof typeof TONES_MAPPED_TO_LOCATION]
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.imagePreviewUrl = e.target.result);
      reader.readAsDataURL(file);
      this.uploadImage();
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  uploadImage() {
    if (!this.selectedFile || !this.currentCharacter?.id) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('characterId', this.currentCharacter.id.toString());

    this.movieService.uploadCharacterImage(formData).subscribe({
      next: response => {
        this.generatedImageUrl = response.imageUrl;
        this.isUploading = false;
        this.selectedFile = null;
        this.imagePreviewUrl = null;
      },
      error: err => {
        console.error('Error uploading image:', err);
        this.isUploading = false;
        alert('Failed to upload image. Please try again.');
      },
    });
  }
}
