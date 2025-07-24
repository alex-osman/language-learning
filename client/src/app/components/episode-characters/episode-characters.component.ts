import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CharacterDTO } from '../../services/data.service';
import { MediaService } from '../../services/media.service';
import { CharacterExplorerComponent } from '../character-explorer/character-explorer.component';

@Component({
  selector: 'app-episode-characters',
  standalone: true,
  imports: [CommonModule, CharacterExplorerComponent],
  template: `
    <app-character-explorer
      [characters]="characters"
      [isLoading]="isLoading"
      [error]="error"
      title="Characters in this Episode"
      [showStats]="true"
      [showSorting]="true"
      [showFilters]="true"
      [compact]="true"
      mode="explorer"
      [showActions]="true"
      [showLearningButtons]="true"
      [showMovieGeneration]="true"
      [collapsed]="collapsed"
      [showMovie]="true"
    >
    </app-character-explorer>
  `,
  styleUrls: ['./episode-characters.component.scss'],
})
export class EpisodeCharactersComponent implements OnInit {
  @Input() episodeId!: number;
  @Input() collapsed = false;

  characters: CharacterDTO[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private mediaService: MediaService) {}

  ngOnInit() {
    if (this.episodeId) {
      this.loadEpisodeCharacters();
    }
  }

  private loadEpisodeCharacters() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getCharactersForEpisode(this.episodeId).subscribe({
      next: characters => {
        this.characters = characters;
        this.isLoading = false;
        console.log(`Loaded ${characters.length} characters for episode ${this.episodeId}`);
      },
      error: err => {
        console.error('Error loading episode characters:', err);
        this.error = 'Failed to load episode characters.';
        this.isLoading = false;
      },
    });
  }
}
