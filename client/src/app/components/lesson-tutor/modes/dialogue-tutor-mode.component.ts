import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChoiceDrill, TutorLine, TutorLineState } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-dialogue-tutor-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialogue-tutor-mode.component.html',
})
export class DialogueTutorModeComponent {
  @Input() title = '';
  @Input() guide = '';
  @Input() lines: TutorLine[] = [];
  @Input() drill: ChoiceDrill | undefined;
  @Input() speakingId: number | null = null;
  @Input() lineState = new Map<number, TutorLineState>();

  @Output() speakLine = new EventEmitter<{ id: number; text: string; lineIndex: number }>();

  lineShow(id: number): TutorLineState {
    if (!this.lineState.has(id)) {
      this.lineState.set(id, { pinyin: false, english: false, practiced: false });
    }
    return this.lineState.get(id)!;
  }

  togglePinyin(id: number): void {
    const state = this.lineShow(id);
    state.pinyin = !state.pinyin;
  }

  toggleEnglish(id: number): void {
    const state = this.lineShow(id);
    state.english = !state.english;
  }

  markPracticed(id: number): void {
    this.lineShow(id).practiced = true;
  }

  selectDrill(choice: string): void {
    if (this.drill) this.drill.selected = choice;
  }

}
