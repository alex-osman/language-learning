import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RadicalProp } from 'src/app/interfaces/mandarin-blueprint.interface';
import { CharacterDTO, DataService, Tone } from '../../services/data.service';
import { CharacterExplorerComponent } from '../character-explorer/character-explorer.component';
import {
  ProgressIndicatorComponent,
  ProgressSegment,
} from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule, CharacterExplorerComponent, ProgressIndicatorComponent],
  template: `
    <div class="characters-page">
      <!-- Progress Indicator -->
      <div class="progress-section">
        <h2>Character Learning Progress</h2>
        <app-progress-indicator [segments]="charactersProgress"></app-progress-indicator>
      </div>

      <!-- Character Explorer -->
      <app-character-explorer
        [characters]="characters"
        [isLoading]="isLoading"
        [error]="error"
        title="All Characters"
        [showStats]="true"
        [showSorting]="true"
        [showFilters]="true"
        [compact]="false"
        mode="explorer"
        [showActions]="true"
        [showLearningButtons]="true"
        [showMovieGeneration]="true"
      >
      </app-character-explorer>
    </div>
  `,
  styleUrls: ['./characters.component.scss'],
})
export class CharactersComponent implements OnInit {
  characters: CharacterDTO[] = [];
  isLoading = true;
  error: string | null = null;
  tones: Tone | null = null;
  radicalProps: RadicalProp[] = [];
  charactersProgress: ProgressSegment[] = [];

  constructor(private dataService: DataService) {}

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

    this.dataService.getCharacters().subscribe({
      next: characters => {
        this.characters = characters;
        this.updateCharactersProgress();
        this.isLoading = false;
        this.getAdditionalCharacters();
      },
      error: err => {
        console.error('Error loading characters:', err);
        this.error = 'Failed to load characters.';
        this.isLoading = false;
      },
    });
  }

  private getAdditionalCharacters() {
    this.dataService.getAdditionalCharacters(400).subscribe({
      next: characters => {
        this.characters = [...this.characters, ...characters];
        this.updateCharactersProgress();
      },
      error: err => {
        console.error('Error loading additional characters:', err);
      },
    });
  }

  private loadTones() {
    this.dataService.getTones().subscribe({
      next: tones => {
        this.tones = tones;
      },
      error: err => {
        console.error('Error loading tones:', err);
      },
    });
  }

  private updateCharactersProgress() {
    const totalCharacters = this.characters.length;
    const knownCharacters = this.characters.filter(char => !!char.lastReviewDate).length;
    const unknownCharacters = totalCharacters - knownCharacters;

    this.charactersProgress = [
      {
        label: 'Known',
        value: totalCharacters > 0 ? Math.round((knownCharacters / totalCharacters) * 100) : 0,
        color: '#28a745',
      },
      {
        label: 'Unknown',
        value: totalCharacters > 0 ? Math.round((unknownCharacters / totalCharacters) * 100) : 0,
        color: '#dc3545',
      },
    ];
  }
}
