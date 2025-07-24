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
    if (!this.mediaId) {
      this.error = 'No media selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService.getEpisodesForMedia(parseInt(this.mediaId)).subscribe({
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
    this.router.navigate(['/media', this.mediaId, 'episodes', episode.id]);
  }

  deleteEpisode(episode: Episode, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${episode.title}"? This will permanently delete the episode and all its scenes and sentences.`)) {
      this.mediaService.deleteEpisode(episode.id).subscribe({
        next: () => {
          this.episodes = this.episodes.filter(e => e.id !== episode.id);
        },
        error: (error) => {
          console.error('Failed to delete episode:', error);
          alert('Failed to delete episode. Please try again.');
        }
      });
    }
  }
}
