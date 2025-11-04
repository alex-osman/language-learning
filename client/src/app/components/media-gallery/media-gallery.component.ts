import { Component, OnInit } from '@angular/core';
import {
  Media,
  MediaService,
  YouTubeImportRequest,
  YouTubeImportResult,
} from '../../services/media.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProgressIndicatorComponent],
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
})
export class MediaGalleryComponent implements OnInit {
  mediaList: Media[] = [];
  isLoading = true;
  error: string | null = null;

  // YouTube import form fields
  youtubeUrl = '';
  seasonId: number | null = null;
  title = '';
  dryRun = false;

  // YouTube import state
  isImporting = false;
  importError: string | null = null;
  importSuccess: string | null = null;

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
    this.router.navigate(['/media', media.id, 'episodes']);
  }

  onYouTubeImport(): void {
    if (!this.youtubeUrl || !this.seasonId) {
      this.importError = 'YouTube URL and Season ID are required';
      return;
    }

    this.isImporting = true;
    this.importError = null;
    this.importSuccess = null;

    const request: YouTubeImportRequest = {
      youtubeUrl: this.youtubeUrl,
      seasonId: this.seasonId,
      title: this.title || undefined,
      preferredLanguage: 'zh',
      dryRun: this.dryRun,
    };

    this.mediaService.importFromYouTube(request).subscribe({
      next: (result: YouTubeImportResult) => {
        this.isImporting = false;
        if (result.success) {
          this.importSuccess = result.message;
          // Clear form on success
          this.youtubeUrl = '';
          this.seasonId = null;
          this.title = '';
          this.dryRun = false;
        } else {
          this.importError = result.message;
        }
      },
      error: err => {
        this.isImporting = false;
        this.importError =
          'Import failed: ' + (err.error?.message || err.message || 'Unknown error');
      },
    });
  }
}
