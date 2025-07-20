import { Component, OnInit } from '@angular/core';
import { Episode, MediaService } from '../../services/media.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-episode-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressIndicatorComponent],
  templateUrl: './episode-gallery.component.html',
  styleUrls: ['./episode-gallery.component.scss'],
})
export class EpisodeGalleryComponent implements OnInit {
  episodes: Episode[] = [];
  isLoading = true;
  error: string | null = null;
  mediaId: string = '';
  seasonId: string = '';

  constructor(
    private mediaService: MediaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mediaId = this.route.snapshot.paramMap.get('mediaId') || '';
    this.seasonId = this.route.snapshot.paramMap.get('seasonId') || '';
    if (!this.mediaId || !this.seasonId) {
      this.error = 'No media or season selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService.getEpisodesForSeason(this.mediaId, this.seasonId).subscribe({
      next: episodes => {
        this.episodes = episodes;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load episodes.';
        this.isLoading = false;
      },
    });
  }

  onEpisodeClick(episode: Episode): void {
    this.router.navigate([
      '/media',
      this.mediaId,
      'seasons',
      this.seasonId,
      'episodes',
      episode.id,
    ]);
  }
}
