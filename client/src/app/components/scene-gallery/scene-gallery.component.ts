import { Component, OnInit } from '@angular/core';
import { Scene, MediaService } from '../../services/media.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-scene-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressIndicatorComponent],
  templateUrl: './scene-gallery.component.html',
  styleUrls: ['./scene-gallery.component.scss'],
})
export class SceneGalleryComponent implements OnInit {
  scenes: Scene[] = [];
  isLoading = true;
  error: string | null = null;
  mediaId: string = '';
  seasonId: string = '';
  episodeId: string = '';

  constructor(
    private mediaService: MediaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mediaId = this.route.snapshot.paramMap.get('mediaId') || '';
    this.seasonId = this.route.snapshot.paramMap.get('seasonId') || '';
    this.episodeId = this.route.snapshot.paramMap.get('episodeId') || '';
    if (!this.mediaId || !this.seasonId || !this.episodeId) {
      this.error = 'No media, season, or episode selected.';
      this.isLoading = false;
      return;
    }
    this.mediaService.getScenesForEpisode(this.mediaId, this.seasonId, this.episodeId).subscribe({
      next: scenes => {
        this.scenes = scenes;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load scenes.';
        this.isLoading = false;
      },
    });
  }

  onSceneClick(scene: Scene): void {
    this.router.navigate([
      '/media',
      this.mediaId,
      'seasons',
      this.seasonId,
      'episodes',
      this.episodeId,
      'scenes',
      scene.id,
    ]);
  }
}
