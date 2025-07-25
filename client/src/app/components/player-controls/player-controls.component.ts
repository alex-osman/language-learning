import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

interface SubtitleLayers {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
}

@Component({
  selector: 'app-player-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-controls.component.html',
  styleUrl: './player-controls.component.scss',
})
export class PlayerControlsComponent {
  @Input() isPlaying = false;
  @Input() currentTime = 0;
  @Input() duration = 0;
  @Input() volume = 1;
  @Input() playbackRate = 1;
  @Input() playbackSpeeds: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
  @Input() subtitleLayers!: SubtitleLayers;

  @Output() playPause = new EventEmitter<void>();
  @Output() seek = new EventEmitter<number>();
  @Output() volumeChange = new EventEmitter<number>();
  @Output() speedChange = new EventEmitter<number>();
  @Output() layerToggle = new EventEmitter<keyof SubtitleLayers>();

  // UI state
  showVolumeSlider = false;
  showSpeedMenu = false;
  showSubtitleMenu = false;
  isDraggingProgress = false;

  get progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }

  get formattedCurrentTime(): string {
    return this.formatTime(this.currentTime);
  }

  get formattedDuration(): string {
    return this.formatTime(this.duration);
  }

  onPlayPauseClick() {
    this.playPause.emit();
  }

  onProgressClick(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * this.duration;
    this.seek.emit(newTime);
  }

  onVolumeChange(event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value);
    this.volumeChange.emit(volume);
  }

  onSpeedChange(speed: number) {
    this.speedChange.emit(speed);
    this.showSpeedMenu = false;
  }

  onLayerToggle(layer: keyof SubtitleLayers) {
    this.layerToggle.emit(layer);
  }

  toggleVolumeSlider() {
    this.showVolumeSlider = !this.showVolumeSlider;
    this.showSpeedMenu = false;
    this.showSubtitleMenu = false;
  }

  toggleSpeedMenu() {
    this.showSpeedMenu = !this.showSpeedMenu;
    this.showVolumeSlider = false;
    this.showSubtitleMenu = false;
  }

  toggleSubtitleMenu() {
    this.showSubtitleMenu = !this.showSubtitleMenu;
    this.showVolumeSlider = false;
    this.showSpeedMenu = false;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
