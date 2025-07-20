import { Component, OnInit } from '@angular/core';
import { Season, MediaService } from '../../services/media.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-season-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressIndicatorComponent],
  templateUrl: './season-gallery.component.html',
  styleUrls: ['./season-gallery.component.scss'],
})
export class SeasonGalleryComponent implements OnInit {
  seasons: Season[] = [];
  isLoading = true;
  error: string | null = null;
  mediaId: string = '';

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
    this.mediaService.getSeasonsForMedia(parseInt(this.mediaId)).subscribe({
      next: seasons => {
        this.seasons = seasons;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load seasons.';
        this.isLoading = false;
      },
    });
  }

  onSeasonClick(season: Season): void {
    this.router.navigate(['/media', this.mediaId, 'seasons', season.id, 'episodes']);
  }
}
