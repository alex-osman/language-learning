import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MediaService, Sentence } from '../../services/media.service';

@Component({
  selector: 'app-sentence-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sentence-gallery.component.html',
  styleUrls: ['./sentence-gallery.component.scss'],
})
export class SentenceGalleryComponent implements OnInit {
  sentences: Sentence[] = [];
  isLoading = true;
  error: string | null = null;
  mediaId: string = '';
  seasonId: string = '';
  episodeId: string = '';
  sceneId: string = '';

  constructor(private mediaService: MediaService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.mediaId = this.route.snapshot.paramMap.get('mediaId') || '';
    this.seasonId = this.route.snapshot.paramMap.get('seasonId') || '';
    this.episodeId = this.route.snapshot.paramMap.get('episodeId') || '';
    this.sceneId = this.route.snapshot.paramMap.get('sceneId') || '';
    if (!this.mediaId || !this.seasonId || !this.episodeId || !this.sceneId) {
      this.error = 'No media, season, episode, or scene selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService
      .getSentencesForScene(this.mediaId, this.seasonId, this.episodeId, this.sceneId)
      .subscribe({
        next: sentences => {
          this.sentences = sentences;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load sentences.';
          this.isLoading = false;
        },
      });
  }
}
