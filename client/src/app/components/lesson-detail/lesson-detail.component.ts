import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CharKnowledgeDTO,
  LessonDetailDTO,
  LessonSentenceDTO,
  LessonService,
  LessonWordDTO,
} from '../../services/lesson.service';
import { CharacterTooltipComponent } from '../character-tooltip/character-tooltip.component';
import { CharacterHoverDirective, CharacterHoverEvent } from '../../directives/character-hover.directive';
import { AnalyzedCharacter } from '../../services/sentence-analysis.service';

export interface CharSpan {
  char: string;
  color: string;
}

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CharacterTooltipComponent, CharacterHoverDirective],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.scss'],
})
export class LessonDetailComponent implements OnInit {
  lesson: LessonDetailDTO | null = null;
  isLoading = true;
  error: string | null = null;
  lessonNumber = 0;
  wordSpans = new Map<number, CharSpan[]>(); // keyed by word id
  sentenceSpans = new Map<number, CharSpan[]>(); // keyed by sentence id

  hoveredCharacter: AnalyzedCharacter | null = null;
  tooltipPosition = { x: 0, y: 0 };
  private hideTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private route: ActivatedRoute, private lessonService: LessonService) {}

  ngOnInit(): void {
    this.lessonNumber = Number(this.route.snapshot.paramMap.get('lessonNumber'));
    this.lessonService.getLesson(this.lessonNumber).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.wordSpans = this.buildWordSpans(lesson);
        this.sentenceSpans = this.buildSentenceSpans(lesson);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load lesson.';
        this.isLoading = false;
      },
    });

    this.loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  get coreWords(): LessonWordDTO[] {
    return this.lesson?.words.filter((w) => !w.isProperNoun) ?? [];
  }

  get properNouns(): LessonWordDTO[] {
    return this.lesson?.words.filter((w) => w.isProperNoun) ?? [];
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'learned':  return 'Learned';
      case 'learning': return 'Learning';
      case 'seen':     return 'Seen';
      default:         return 'New';
    }
  }

  markingAllSeen = false;
  autoMarkingLearned = false;
  lineState = new Map<number, { p: boolean; e: boolean }>();

  private meijiaVoice: SpeechSynthesisVoice | null = null;
  private tingtingVoice: SpeechSynthesisVoice | null = null;

  private loadVoices(): void {
    const all = window.speechSynthesis.getVoices();
    this.meijiaVoice = all.find((v) => v.name.toLowerCase().replace('-', '') === 'meijia') ?? null;
    this.tingtingVoice = all.find((v) => v.name.toLowerCase().replace('-', '') === 'tingting') ?? null;
  }

  lineShow(id: number): { p: boolean; e: boolean } {
    if (!this.lineState.has(id)) this.lineState.set(id, { p: false, e: false });
    return this.lineState.get(id)!;
  }

  toggleLineP(id: number): void { const s = this.lineShow(id); s.p = !s.p; }
  toggleLineE(id: number): void { const s = this.lineShow(id); s.e = !s.e; }

  speakingId: number | null = null;

  speak(id: number, text: string, lineIndex: number = 0): void {
    window.speechSynthesis.cancel();
    if (this.speakingId === id) { this.speakingId = null; return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-CN';
    utt.rate = 1.0;
    const voice = lineIndex % 2 === 0 ? this.meijiaVoice : this.tingtingVoice;
    if (voice) utt.voice = voice;
    utt.onend = () => { this.speakingId = null; };
    utt.onerror = () => { this.speakingId = null; };
    this.speakingId = id;
    window.speechSynthesis.speak(utt);
  }

  autoMarkLearned(): void {
    if (!this.lesson) return;
    this.autoMarkingLearned = true;
    this.lessonService.autoMarkLearned(this.lessonNumber).subscribe({
      next: (markedIds) => {
        const idSet = new Set(markedIds);
        this.lesson!.words.forEach((w) => {
          if (idSet.has(w.id)) w.knowledgeStatus = 'learned';
        });
        this.autoMarkingLearned = false;
      },
      error: () => { this.autoMarkingLearned = false; },
    });
  }

  markAllSeen(): void {
    if (!this.lesson) return;
    this.markingAllSeen = true;
    this.lessonService.markAllSeen(this.lessonNumber).subscribe({
      next: () => {
        this.lesson!.words.forEach((w) => {
          if (w.knowledgeStatus === 'unknown') w.knowledgeStatus = 'seen';
        });
        this.markingAllSeen = false;
      },
      error: () => { this.markingAllSeen = false; },
    });
  }

  toggleKnown(word: LessonWordDTO): void {
    if (word.knowledgeStatus === 'unknown') {
      this.lessonService.markWordSeen(word.id).subscribe(() => {
        word.knowledgeStatus = 'seen';
      });
    } else if (word.knowledgeStatus === 'seen') {
      this.lessonService.markWordKnown(word.id).subscribe(() => {
        word.knowledgeStatus = 'learned';
      });
    } else {
      this.lessonService.resetWordKnown(word.id).subscribe(() => {
        word.knowledgeStatus = 'unknown';
      });
    }
  }

  private buildWordSpans(lesson: LessonDetailDTO): Map<number, CharSpan[]> {
    const map = new Map<number, CharSpan[]>();
    for (const word of lesson.words) {
      map.set(word.id, [...word.word].map((ch) => ({
        char: ch,
        color: this.charColor(lesson.charKnowledge[ch]),
      })));
    }
    return map;
  }

  spansFor(wordId: number): CharSpan[] {
    return this.wordSpans.get(wordId) ?? [];
  }

  spansForSentence(sentenceId: number): CharSpan[] {
    return this.sentenceSpans.get(sentenceId) ?? [];
  }

  private buildSentenceSpans(lesson: LessonDetailDTO): Map<number, CharSpan[]> {
    const map = new Map<number, CharSpan[]>();
    for (const dialogue of lesson.dialogues) {
      for (const s of dialogue) {
        map.set(s.id, [...s.chinese].map((ch) => ({
          char: ch,
          color: this.charColor(lesson.charKnowledge[ch]),
        })));
      }
    }
    return map;
  }

  onCharacterHover(event: CharacterHoverEvent): void {
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
    const ck = this.lesson?.charKnowledge ?? {};
    const dto: CharKnowledgeDTO | undefined = ck[event.character];
    this.hoveredCharacter = {
      char: event.character,
      known: !!dto && dto.status !== 'unknown',
      count: 1,
      charData: dto ? {
        pinyin: dto.pinyin,
        definition: dto.definition,
        easinessFactor: dto.easinessFactor,
        repetitions: dto.repetitions,
        lastReviewDate: dto.status === 'learning' || dto.status === 'learned' ? true : null,
      } : undefined,
    };
    this.tooltipPosition = {
      x: event.rect.left + event.rect.width / 2,
      y: event.rect.top - 15,
    };
  }

  onCharacterLeave(): void {
    this.hideTooltipTimeout = setTimeout(() => {
      this.hoveredCharacter = null;
      this.hideTooltipTimeout = null;
    }, 100);
  }

  private charColor(dto: CharKnowledgeDTO | undefined): string {
    if (!dto) return 'var(--char-unknown)';
    switch (dto.status) {
      case 'seen':     return 'var(--char-seen)';
      case 'learning':
      case 'learned':  return this.scoreColor(dto.score);
      default:         return 'var(--char-unknown)';
    }
  }

  private scoreColor(score: number): string {
    const hue = Math.round(score * 120);
    return `hsl(${hue}, 65%, 42%)`;
  }
}
