import { isDevMode } from '@angular/core';
import { TutorContent } from './lesson-tutor-content.types';
import { LESSON_1_TUTOR_CONTENT } from './lesson-1-tutor-content';
import { LESSON_2_TUTOR_CONTENT } from './lesson-2-tutor-content';
import { LESSON_3_TUTOR_CONTENT } from './lesson-3-tutor-content';
import { validateTutorContentRegistry } from './lesson-tutor-content.validation';

export const TUTOR_CONTENT: Record<number, TutorContent> = {
  1: LESSON_1_TUTOR_CONTENT,
  2: LESSON_2_TUTOR_CONTENT,
  3: LESSON_3_TUTOR_CONTENT,
};

const validation = validateTutorContentRegistry(TUTOR_CONTENT);
if (isDevMode() && (validation.errors.length || validation.warnings.length)) {
  for (const error of validation.errors) console.error(`[Lesson Tutor Content] ${error}`);
  for (const warning of validation.warnings) console.warn(`[Lesson Tutor Content] ${warning}`);
}

export function getTutorContent(lessonNumber: number): TutorContent | undefined {
  return TUTOR_CONTENT[lessonNumber];
}

export function hasTutorContent(lessonNumber: number): boolean {
  return !!getTutorContent(lessonNumber);
}

export function getSupportedTutorLessonNumbers(): number[] {
  return Object.keys(TUTOR_CONTENT).map(Number).sort((a, b) => a - b);
}
