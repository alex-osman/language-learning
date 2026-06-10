import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleplayConfig, RoleplayTranscriptTurn } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-roleplay-tutor-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roleplay-tutor-mode.component.html',
})
export class RoleplayTutorModeComponent implements OnChanges {
  @Input({ required: true }) config!: RoleplayConfig;
  @Input() transcript: RoleplayTranscriptTurn[] = [];
  @Input() isLoading = false;
  @Input() error: string | null = null;

  @Output() submitLearnerMessage = new EventEmitter<string>();
  @Output() retry = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  draft = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config && this.transcript.length === 0) {
      this.reset.emit();
    }
  }

  submit(): void {
    const message = this.draft.trim();
    if (!message || this.isLoading) return;
    this.submitLearnerMessage.emit(message);
    this.draft = '';
  }

  togglePinyin(turn: RoleplayTranscriptTurn): void {
    turn.showPinyin = !turn.showPinyin;
  }

  toggleEnglish(turn: RoleplayTranscriptTurn): void {
    turn.showEnglish = !turn.showEnglish;
  }
}
