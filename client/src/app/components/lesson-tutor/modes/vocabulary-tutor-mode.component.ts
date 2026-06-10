import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TutorWord } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-vocabulary-tutor-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vocabulary-tutor-mode.component.html',
})
export class VocabularyTutorModeComponent {
  @Input() vocabNote = '';
  @Input() coreWords: TutorWord[] = [];
  @Input() properNouns: TutorWord[] = [];
}
