import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, SceneDTO, Sentence } from '../../services/media.service';
import { SubtitleOverlayComponent } from '../subtitle-overlay/subtitle-overlay.component';
import { PlayerControlsComponent } from '../player-controls/player-controls.component';

interface SubtitleLayers {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
}

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, SubtitleOverlayComponent, PlayerControlsComponent],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('sentenceList') sentenceList!: ElementRef<HTMLDivElement>;

  // Route parameters
  mediaId: string = '';
  episodeId: string = '';
  sceneId: number = 0;

  // Component state
  scene: SceneDTO | null = null;
  isLoading = true;
  error: string | null = null;

  // Video state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;

  // Subtitle state
  currentSentence: Sentence | null = null;
  subtitleLayers: SubtitleLayers = {
    chinese: true,
    pinyin: true,
    english: false,
  };

  // Available playback speeds
  playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  private timeUpdateInterval?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  ngAfterViewInit() {
    // Setup video listeners after view initialization
    if (this.scene) {
      this.setupVideoListeners();
    }
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.episodeId = params['episodeId'] || '';
      this.sceneId = params['sceneId'] || '';

      if (this.hasValidRouteParameters()) {
        this.loadSceneData();
      } else {
        this.handleRouteError();
      }
    });
  }

  private hasValidRouteParameters(): boolean {
    return !!(this.mediaId && this.episodeId && this.sceneId);
  }

  private handleRouteError() {
    this.error = 'Missing required route parameters.';
    this.isLoading = false;
  }

  private loadSceneData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getScene(this.sceneId).subscribe({
      next: scene => this.handleSceneLoaded(scene),
      error: err => this.handleSceneLoadError(err),
    });
  }

  private handleSceneLoaded(scene: SceneDTO) {
    this.scene = scene;
    this.isLoading = false;
    // Setup video listeners after the view is initialized
    setTimeout(() => this.setupVideoListeners(), 0);
  }

  private handleSceneLoadError(err: any) {
    console.error('Error loading scene:', err);
    this.error = 'Failed to load scene data.';
    this.isLoading = false;
  }

  private setupVideoListeners() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;

      video.addEventListener('loadedmetadata', () => {
        this.duration = video.duration;
      });

      video.addEventListener('timeupdate', () => {
        this.currentTime = video.currentTime;
        this.updateCurrentSubtitle();
      });

      video.addEventListener('play', () => {
        this.isPlaying = true;
      });

      video.addEventListener('pause', () => {
        this.isPlaying = false;
      });

      video.addEventListener('volumechange', () => {
        this.volume = video.volume;
      });

      video.addEventListener('ratechange', () => {
        this.playbackRate = video.playbackRate;
      });
    }
  }

  private updateCurrentSubtitle() {
    if (!this.scene?.sentences) return;

    const currentTimeMs = this.currentTime * 1000;
    const currentSentence = this.scene.sentences.find(
      sentence => currentTimeMs >= sentence.startMs && currentTimeMs <= sentence.endMs
    );

    const previousSentence = this.currentSentence;
    this.currentSentence = currentSentence || null;

    // Trigger autoscroll if sentence changed and autoscroll is enabled
    if (this.currentSentence && this.currentSentence !== previousSentence) {
      this.scrollToCurrentSentence();
    }
  }

  // Video control methods
  togglePlayPause() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  seekTo(time: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = time;
    }
  }

  setVolume(volume: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.volume = volume;
    }
  }

  setPlaybackRate(rate: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.playbackRate = rate;
    }
  }

  private scrollToCurrentSentence() {
    if (!this.currentSentence || !this.sentenceList?.nativeElement) return;

    const sentenceElement = this.sentenceList.nativeElement.querySelector(
      `[data-sentence-id="${this.currentSentence.id}"]`
    ) as HTMLElement;

    if (sentenceElement) {
      sentenceElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }

  // Subtitle control methods
  toggleSubtitleLayer(layer: keyof SubtitleLayers) {
    this.subtitleLayers[layer] = !this.subtitleLayers[layer];
  }

  goToSentence(sentence: Sentence) {
    this.seekTo(sentence.startMs / 1000);
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
