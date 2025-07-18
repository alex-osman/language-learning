import { Component, OnInit } from '@angular/core';
import { Media, MediaService } from '../../services/media.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressIndicatorComponent],
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
})
export class MediaGalleryComponent implements OnInit {
  mediaList: Media[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private mediaService: MediaService, private router: Router) {}

  ngOnInit(): void {
    this.mediaService.getAllMedia().subscribe({
      next: media => {
        this.mediaList = media;
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Failed to load media.';
        this.isLoading = false;
      },
    });
  }

  onMediaClick(media: Media): void {
    if (media.type === 'tv') {
      this.router.navigate(['/media', media.id, 'seasons']);
    } else if (media.type === 'movie') {
      // For movies, treat as a single season/episode for now
      this.router.navigate(['/media', media.id, 'seasons', 'default', 'episodes']);
    }
  }
}
