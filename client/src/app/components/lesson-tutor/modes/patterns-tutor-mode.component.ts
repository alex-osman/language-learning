import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChoiceDrill, PatternCard } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-patterns-tutor-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patterns-tutor-mode.component.html',
})
export class PatternsTutorModeComponent {
  @Input() patterns: PatternCard[] = [];
  @Input() drills: ChoiceDrill[] = [];

  selectDrill(drill: ChoiceDrill, choice: string): void {
    drill.selected = choice;
  }
}
