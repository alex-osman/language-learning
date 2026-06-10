import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TutorLine } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-review-tutor-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-tutor-mode.component.html',
})
export class ReviewTutorModeComponent {
  @Input() practicedLines = 0;
  @Input() completedDrills = 0;
  @Input() generatedSentenceCount = 0;
  @Input() lines: TutorLine[] = [];

  @Output() speakLine = new EventEmitter<{ id: number; text: string; lineIndex: number }>();
}
