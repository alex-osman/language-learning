import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LessonDetailDTO, LessonService } from '../../services/lesson.service';
import { cloneDrills, cloneProfile, ChoiceDrill, generatePersonalSentences, PersonalProfile, RoleplayTranscriptTurn, TutorContent, TutorLine, TutorLineState, TutorMode, TutorWord } from './content/lesson-tutor-content.types';
import { getSupportedTutorLessonNumbers, getTutorContent } from './content/lesson-tutor-content.registry';
import { LessonRoleplayService } from '../../services/lesson-roleplay.service';
import { DialogueTutorModeComponent } from './modes/dialogue-tutor-mode.component';
import { VocabularyTutorModeComponent } from './modes/vocabulary-tutor-mode.component';
import { PatternsTutorModeComponent } from './modes/patterns-tutor-mode.component';
import { PersonalPracticeModeComponent } from './modes/personal-practice-mode.component';
import { ReviewTutorModeComponent } from './modes/review-tutor-mode.component';
import { RoleplayTutorModeComponent } from './modes/roleplay-tutor-mode.component';

@Component({
  selector: 'app-lesson-tutor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogueTutorModeComponent,
    RoleplayTutorModeComponent,
    VocabularyTutorModeComponent,
    PatternsTutorModeComponent,
    PersonalPracticeModeComponent,
    ReviewTutorModeComponent,
  ],
  templateUrl: './lesson-tutor.component.html',
  styleUrls: ['./lesson-tutor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LessonTutorComponent implements OnInit {
  lesson: LessonDetailDTO | null = null;
  content: TutorContent = getTutorContent(2)!;
  lessonNumber = 0;
  isLoading = true;
  error: string | null = null;
  activeMode: TutorMode = 'dialogue';
  modes: Array<{ id: TutorMode; label: string }> = [
    { id: 'dialogue', label: 'Dialogue' },
  ];

  tutorWords: TutorWord[] = [];
  tutorDialogues: TutorLine[][] = [];
  lineState = new Map<number, TutorLineState>();
  speakingId: number | null = null;
  private meijiaVoice: SpeechSynthesisVoice | null = null;
  private tingtingVoice: SpeechSynthesisVoice | null = null;

  drills: ChoiceDrill[] = [];
  roleplayTranscript: RoleplayTranscriptTurn[] = [];
  roleplayIsLoading = false;
  roleplayError: string | null = null;
  private lastRoleplayMessage: string | null = null;

  familyProfile: PersonalProfile = cloneProfile(this.content.personalPractice.defaultProfile);
  generatedFamilySentences: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private lessonService: LessonService,
    private lessonRoleplayService: LessonRoleplayService,
  ) {}

  ngOnInit(): void {
    this.lessonNumber = Number(this.route.snapshot.paramMap.get('lessonNumber'));
    const content = getTutorContent(this.lessonNumber);
    if (!content) {
      this.error = `Tutor prototype is currently available for Lessons ${getSupportedTutorLessonNumbers().join(' and ')} only.`;
      this.isLoading = false;
      return;
    }
    this.content = content;
    this.tutorDialogues = content.dialogues;
    this.drills = cloneDrills(content.drills);
    this.familyProfile = cloneProfile(content.personalPractice.defaultProfile);
    this.modes = this.buildModes(content);
    this.resetRoleplay();
    this.loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
    this.loadFamilyProfile();

    this.lessonService.getLesson(this.lessonNumber).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.tutorWords = this.buildTutorWords(lesson);
        this.generatedFamilySentences = this.buildFamilySentences();
        this.isLoading = false;
      },
      error: () => {
        this.error = `Failed to load Lesson ${this.lessonNumber} tutor.`;
        this.isLoading = false;
      },
    });
  }

  setMode(mode: TutorMode): void {
    this.activeMode = mode;
  }

  get dialogueOne(): TutorLine[] {
    return this.tutorDialogues[0] ?? [];
  }

  get dialogueTwo(): TutorLine[] {
    return this.tutorDialogues[1] ?? [];
  }

  get coreWords(): TutorWord[] {
    return this.tutorWords.filter((word) => !word.isProperNoun);
  }

  get properNouns(): TutorWord[] {
    return this.tutorWords.filter((word) => word.isProperNoun);
  }

  get completedDrills(): number {
    return this.drills.filter((drill) => drill.selected === drill.answer).length;
  }

  get practicedLines(): number {
    return [...this.lineState.values()].filter((line) => line.practiced).length;
  }

  saveFamilyProfile(): void {
    localStorage.setItem(this.content.personalPractice.storageKey, JSON.stringify(this.familyProfile));
    this.generatedFamilySentences = this.buildFamilySentences();
  }

  resetFamilyProfile(): void {
    this.familyProfile = cloneProfile(this.content.personalPractice.defaultProfile);
    localStorage.removeItem(this.content.personalPractice.storageKey);
    this.generatedFamilySentences = this.buildFamilySentences();
  }

  handleSpeak(event: { id: number; text: string; lineIndex: number }): void {
    this.speak(event.id, event.text, event.lineIndex);
  }

  resetRoleplay(): void {
    this.roleplayError = null;
    this.roleplayIsLoading = false;
    this.lastRoleplayMessage = null;
    this.roleplayTranscript = this.content.roleplay
      ? [{ speaker: 'tutor', ...this.content.roleplay.openingLine, showPinyin: false, showEnglish: false }]
      : [];
  }

  submitRoleplayMessage(message: string): void {
    if (!this.content.roleplay || this.roleplayIsLoading) return;
    this.roleplayError = null;
    this.lastRoleplayMessage = message;
    this.roleplayTranscript = [...this.roleplayTranscript, { speaker: 'learner', text: message }];
    this.requestRoleplayTurn(message);
  }

  retryRoleplay(): void {
    if (!this.lastRoleplayMessage || !this.content.roleplay || this.roleplayIsLoading) return;
    this.roleplayError = null;
    this.requestRoleplayTurn(this.lastRoleplayMessage);
  }

  speak(id: number, text: string, lineIndex = 0): void {
    window.speechSynthesis.cancel();
    if (this.speakingId === id) {
      this.speakingId = null;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.92;
    const voice = lineIndex % 2 === 0 ? this.meijiaVoice : this.tingtingVoice;
    if (voice) utterance.voice = voice;
    utterance.onend = () => { this.speakingId = null; };
    utterance.onerror = () => { this.speakingId = null; };
    this.speakingId = id;
    window.speechSynthesis.speak(utterance);
  }

  private buildTutorWords(lesson: LessonDetailDTO): TutorWord[] {
    const apiByWord = new Map(lesson.words.map((word) => [word.word, word]));
    return this.content.words.map((word, index) => {
      const apiWord = apiByWord.get(word.word);
      return {
        id: apiWord?.id ?? -(index + 1),
        word: word.word,
        pinyin: word.pinyin,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
        isProperNoun: word.isProperNoun,
        knowledgeStatus: apiWord?.knowledgeStatus ?? 'unknown',
        sourceOrder: word.sourceOrder,
      };
    });
  }

  private loadVoices(): void {
    const voices = window.speechSynthesis.getVoices();
    this.meijiaVoice = voices.find((voice) => voice.name.toLowerCase().replace('-', '') === 'meijia') ?? null;
    this.tingtingVoice = voices.find((voice) => voice.name.toLowerCase().replace('-', '') === 'tingting') ?? null;
  }

  private loadFamilyProfile(): void {
    const stored = localStorage.getItem(this.content.personalPractice.storageKey);
    if (!stored) return;
    try {
      const parsed = this.normalizeStoredProfile(JSON.parse(stored) as PersonalProfile);
      if (typeof parsed.firstNumber === 'number' && Array.isArray(parsed.selections)) {
        this.familyProfile = parsed;
      }
    } catch {
      localStorage.removeItem(this.content.personalPractice.storageKey);
    }
  }

  private buildFamilySentences(): string[] {
    return generatePersonalSentences(this.content.personalPractice, this.familyProfile);
  }

  private requestRoleplayTurn(message: string): void {
    if (!this.content.roleplay) return;
    this.roleplayIsLoading = true;
    this.lessonRoleplayService.sendTurn({
      lessonNumber: this.lessonNumber,
      learnerMessage: message,
      conversationHistory: this.roleplayTranscript,
      context: this.content.roleplay,
    }).subscribe({
      next: (response) => {
        this.roleplayTranscript = [
          ...this.roleplayTranscript,
          { speaker: 'tutor', ...response, showPinyin: false, showEnglish: false },
        ];
        this.roleplayIsLoading = false;
      },
      error: () => {
        this.roleplayError = 'Roleplay response failed. Try the last turn again.';
        this.roleplayIsLoading = false;
      },
    });
  }

  private buildModes(content: TutorContent): Array<{ id: TutorMode; label: string }> {
    return [
      { id: 'dialogue', label: 'Dialogue' },
      ...(content.roleplay ? [{ id: 'roleplay' as TutorMode, label: 'Roleplay' }] : []),
      { id: 'vocab', label: 'Vocab' },
      { id: 'patterns', label: 'Patterns' },
      { id: 'family', label: 'Personal' },
      { id: 'review', label: 'Review' },
    ];
  }

  private normalizeStoredProfile(profile: PersonalProfile): PersonalProfile {
    return {
      ...profile,
      selections: profile.selections.map((selection) => ({
        ...selection,
        detailText: selection.detailText ?? (selection as unknown as { profession?: string }).profession ?? '',
      })),
    };
  }
}
