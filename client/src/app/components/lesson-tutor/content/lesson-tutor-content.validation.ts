import { PersonalSentencePart, TutorContent, TutorContentValidationResult } from './lesson-tutor-content.types';

export function validateTutorContentRegistry(content: Record<number, TutorContent>): TutorContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [registryKey, lesson] of Object.entries(content)) {
    const lessonNumber = Number(registryKey);
    const prefix = `Lesson ${lessonNumber}`;

    if (lesson.lessonNumber !== lessonNumber) {
      errors.push(`${prefix}: registry key does not match content lessonNumber ${lesson.lessonNumber}.`);
    }

    if (!lesson.title.trim() || !lesson.chineseTitle.trim()) {
      errors.push(`${prefix}: title and chineseTitle are required.`);
    }

    if (!lesson.words.length) errors.push(`${prefix}: at least one vocabulary word is required.`);
    if (!lesson.dialogues.length) errors.push(`${prefix}: at least one dialogue is required.`);
    if (!lesson.personalPractice.storageKey.endsWith(`lesson${lessonNumber}`)) {
      warnings.push(`${prefix}: personalPractice.storageKey should end with lesson${lessonNumber}.`);
    }

    validateWords(prefix, lesson, errors);
    validateDialogues(prefix, lesson, errors);
    validateDrills(prefix, lesson, errors);
    validatePersonalPractice(prefix, lesson, errors);
    validateRoleplay(prefix, lesson, errors);
  }

  return { errors, warnings };
}

function validateRoleplay(prefix: string, lesson: TutorContent, errors: string[]): void {
  if (!lesson.roleplay) return;
  const config = lesson.roleplay;
  if (!config.title.trim()) errors.push(`${prefix}: roleplay title is required.`);
  if (!config.description.trim()) errors.push(`${prefix}: roleplay description is required.`);
  if (!config.scenario.trim()) errors.push(`${prefix}: roleplay scenario is required.`);
  if (!config.openingLine.chinese.trim()) errors.push(`${prefix}: roleplay opening Chinese is required.`);
  if (!config.openingLine.pinyin.trim()) errors.push(`${prefix}: roleplay opening pinyin is required.`);
  if (!config.openingLine.english.trim()) errors.push(`${prefix}: roleplay opening English is required.`);
  if (!config.targetPatterns.length) errors.push(`${prefix}: roleplay needs target patterns.`);
  if (!config.allowedVocabulary.length) errors.push(`${prefix}: roleplay needs allowed vocabulary.`);
  if (!config.conversationGoals.length) errors.push(`${prefix}: roleplay needs conversation goals.`);
}

function validateWords(prefix: string, lesson: TutorContent, errors: string[]): void {
  const seen = new Set<string>();
  for (const word of lesson.words) {
    if (!word.word.trim()) errors.push(`${prefix}: vocabulary item has empty word.`);
    if (!word.pinyin.trim()) errors.push(`${prefix}: ${word.word || 'vocabulary item'} has empty pinyin.`);
    if (!word.definition.trim()) errors.push(`${prefix}: ${word.word || 'vocabulary item'} has empty definition.`);
    if (seen.has(word.word)) errors.push(`${prefix}: duplicate vocabulary word "${word.word}".`);
    seen.add(word.word);
  }
}

function validateDialogues(prefix: string, lesson: TutorContent, errors: string[]): void {
  const ids = new Set<number>();
  for (const dialogue of lesson.dialogues) {
    if (!dialogue.length) errors.push(`${prefix}: dialogue group is empty.`);
    for (const line of dialogue) {
      if (ids.has(line.id)) errors.push(`${prefix}: duplicate dialogue line id ${line.id}.`);
      ids.add(line.id);
      if (!line.chinese.trim()) errors.push(`${prefix}: dialogue line ${line.id} has empty Chinese text.`);
      if (!line.pinyin.trim()) errors.push(`${prefix}: dialogue line ${line.id} has empty pinyin.`);
      if (!line.english.trim()) errors.push(`${prefix}: dialogue line ${line.id} has empty English text.`);
    }
  }
}

function validateDrills(prefix: string, lesson: TutorContent, errors: string[]): void {
  const ids = new Set<string>();
  for (const drill of lesson.drills) {
    if (!drill.id.trim()) errors.push(`${prefix}: drill has empty id.`);
    if (ids.has(drill.id)) errors.push(`${prefix}: duplicate drill id "${drill.id}".`);
    ids.add(drill.id);
    if (!drill.prompt.trim()) errors.push(`${prefix}: drill ${drill.id} has empty prompt.`);
    if (!drill.choices.includes(drill.answer)) errors.push(`${prefix}: drill ${drill.id} answer is not in choices.`);
  }
}

function validatePersonalPractice(prefix: string, lesson: TutorContent, errors: string[]): void {
  const config = lesson.personalPractice;
  const fieldKeys = new Set(config.fields.map((field) => field.key));
  const selectionKeys = new Set(config.defaultProfile.selections.map((selection) => selection.key));

  if (!config.title.trim()) errors.push(`${prefix}: personalPractice title is required.`);
  if (!config.storageKey.trim()) errors.push(`${prefix}: personalPractice storageKey is required.`);
  if (!config.generatedLabel.trim()) errors.push(`${prefix}: personalPractice generatedLabel is required.`);
  if (!config.sentenceTemplates.length) errors.push(`${prefix}: personalPractice needs at least one sentence template.`);

  for (const field of config.fields) {
    if (!field.label.trim()) errors.push(`${prefix}: personalPractice field ${field.key} has empty label.`);
  }

  for (const selection of config.defaultProfile.selections) {
    if (!selection.key.trim()) errors.push(`${prefix}: personalPractice selection has empty key.`);
    if (!selectionKeys.has(selection.key)) errors.push(`${prefix}: personalPractice selection key is invalid.`);
  }

  for (const template of config.sentenceTemplates) {
    const parts = template.kind === 'forEachSelection' ? [...template.parts, ...(template.fallbackParts ?? [])] : template.parts;
    for (const part of parts) validateTemplatePart(prefix, part, fieldKeys, errors);
  }
}

function validateTemplatePart(prefix: string, part: PersonalSentencePart, fieldKeys: Set<string>, errors: string[]): void {
  if (part.kind === 'profile' && !fieldKeys.has(part.key)) {
    errors.push(`${prefix}: sentence template references unconfigured profile field "${part.key}".`);
  }

  if (part.kind === 'literal' && part.value.length === 0) {
    errors.push(`${prefix}: sentence template contains an empty literal.`);
  }
}
