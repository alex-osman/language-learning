import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaybackState } from './playback-state.enum';

@Component({
  selector: 'app-audio-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-controls.component.html',
  styleUrls: ['./audio-controls.component.scss']
})
export class AudioControlsComponent {
  @Input() playbackState: PlaybackState = PlaybackState.Stopped;
  @Output() play = new EventEmitter<boolean>();
  @Output() stop = new EventEmitter<void>();

  readonly PlaybackState = PlaybackState; // Expose enum to template

  togglePlayback(slow: boolean) {
    const targetState = slow ? PlaybackState.PlayingSlow : PlaybackState.PlayingFast;
    
    // Just emit what action we want - let the parent handle state
    if (this.playbackState === targetState) {
      this.stop.emit();
    } else {
      this.play.emit(slow);
    }
  }
} 