import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonalFieldConfig, PersonalPracticeConfig, PersonalProfile } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-personal-practice-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-practice-mode.component.html',
})
export class PersonalPracticeModeComponent {
  @Input({ required: true }) config!: PersonalPracticeConfig;
  @Input({ required: true }) profile!: PersonalProfile;
  @Input() generatedSentences: string[] = [];

  @Output() saveProfile = new EventEmitter<void>();
  @Output() resetProfile = new EventEmitter<void>();

  fieldValue(field: PersonalFieldConfig): string | number {
    return this.profile[field.key];
  }

  setFieldValue(field: PersonalFieldConfig, value: string | number): void {
    if (field.inputType === 'number') {
      this.profile[field.key] = Number(value) as never;
      return;
    }
    this.profile[field.key] = String(value) as never;
  }
}
