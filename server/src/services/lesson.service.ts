import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Word } from '../entities/word.entity';
import { Character } from '../entities/character.entity';
import { UserCharacterKnowledge } from '../entities/user-character-knowledge.entity';
import { Sentence } from '../entities/sentence.entity';
import { UserWordKnowledgeService } from './user-word-knowledge.service';

const CJK_RE = /[一-鿿]/g;
import {
  CharKnowledgeDTO,
  CharKnowledgeStatus,
  LessonDetailDTO,
  LessonSentenceDTO,
  LessonSummaryDTO,
  LessonWordDTO,
} from '../shared/interfaces/data.interface';

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(UserCharacterKnowledge)
    private uckRepository: Repository<UserCharacterKnowledge>,
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
    private userWordKnowledgeService: UserWordKnowledgeService,
  ) {}

  async getLessonsSummary(userId: number): Promise<LessonSummaryDTO[]> {
    const words = await this.wordRepository
      .createQueryBuilder('w')
      .where('w.lessonNumber IS NOT NULL')
      .select(['w.id', 'w.lessonNumber'])
      .getMany();

    if (words.length === 0) return [];

    const wordIds = words.map((w) => w.id);
    const statusMap = await this.userWordKnowledgeService.getStatusMap(userId, wordIds);

    const lessonMap = new Map<number, LessonSummaryDTO>();
    for (const word of words) {
      const lesson = word.lessonNumber!;
      if (!lessonMap.has(lesson)) {
        lessonMap.set(lesson, { lessonNumber: lesson, wordCount: 0, seenCount: 0, learningCount: 0, learnedCount: 0 });
      }
      const summary = lessonMap.get(lesson)!;
      summary.wordCount++;
      const status = statusMap.get(word.id) ?? 'unknown';
      if (status === 'seen') summary.seenCount++;
      else if (status === 'learning') summary.learningCount++;
      else if (status === 'learned') summary.learnedCount++;
    }

    return Array.from(lessonMap.values()).sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  async getLessonDetail(userId: number, lessonNumber: number): Promise<LessonDetailDTO> {
    const words = await this.wordRepository.find({
      where: { lessonNumber },
      order: { id: 'ASC' },
    });

    const wordIds = words.map((w) => w.id);
    const statusMap = await this.userWordKnowledgeService.getStatusMap(userId, wordIds);

    const lessonWords: LessonWordDTO[] = words.map((w) => ({
      id: w.id,
      word: w.word,
      pinyin: w.pinyin,
      definition: w.definition,
      partOfSpeech: w.partOfSpeech,
      isProperNoun: !!w.isProperNoun,
      knowledgeStatus: statusMap.get(w.id) ?? 'unknown',
    }));

    const charKnowledge = await this.buildCharKnowledgeMap(userId, words.map((w) => w.word));
    const dialogues = await this.getLessonDialogues(lessonNumber);

    return { lessonNumber, words: lessonWords, charKnowledge, dialogues };
  }

  private async getLessonDialogues(lessonNumber: number): Promise<LessonSentenceDTO[][]> {
    const sentences = await this.sentenceRepository.find({
      where: { lesson_number: lessonNumber },
      order: { dialogue_number: 'ASC', sequence_order: 'ASC' },
    });

    const byDialogue = new Map<number, LessonSentenceDTO[]>();
    for (const s of sentences) {
      const dn = s.dialogue_number ?? 1;
      if (!byDialogue.has(dn)) byDialogue.set(dn, []);
      byDialogue.get(dn)!.push({
        id: s.id,
        chinese: s.sentence,
        pinyin: s.pinyin,
        english: s.translation,
        dialogueNumber: dn,
        sequenceOrder: s.sequence_order ?? 0,
      });
    }

    const dialogueNums = [...byDialogue.keys()].sort((a, b) => a - b);
    return dialogueNums.map((dn) => byDialogue.get(dn)!);
  }

  async autoMarkLearnedByChars(userId: number, lessonNumber: number): Promise<number[]> {
    const words = await this.wordRepository.find({ where: { lessonNumber }, order: { id: 'ASC' } });
    if (words.length === 0) return [];

    const wordIds = words.map((w) => w.id);
    const statusMap = await this.userWordKnowledgeService.getStatusMap(userId, wordIds);
    const charKnowledge = await this.buildCharKnowledgeMap(userId, words.map((w) => w.word));

    const markedIds: number[] = [];
    for (const word of words) {
      if ((statusMap.get(word.id) ?? 'unknown') === 'learned') continue;
      const chars = word.word.match(CJK_RE) ?? [];
      if (chars.length === 0) continue;
      if (chars.every((ch) => charKnowledge[ch]?.status === 'learned')) {
        await this.userWordKnowledgeService.markAsKnown(userId, word.id);
        markedIds.push(word.id);
      }
    }
    return markedIds;
  }

  private async buildCharKnowledgeMap(
    userId: number,
    wordTexts: string[],
  ): Promise<Record<string, CharKnowledgeDTO>> {
    const cjkRe = /[一-鿿]/g;
    const uniqueChars = new Set<string>();
    for (const text of wordTexts) {
      for (const ch of text.match(cjkRe) ?? []) uniqueChars.add(ch);
    }
    if (uniqueChars.size === 0) return {};

    const characters = await this.characterRepository.find({
      where: { character: In([...uniqueChars]) },
      select: ['id', 'character', 'pinyin', 'definition'],
    });

    const charIdMap = new Map(characters.map((c) => [c.character, c.id]));
    const charDataMap = new Map(characters.map((c) => [c.character, c]));
    const charIds = characters.map((c) => c.id);

    const uckMap = new Map<number, UserCharacterKnowledge>();
    if (charIds.length > 0) {
      const ucks = await this.uckRepository.find({
        where: { userID: userId, characterID: In(charIds) },
      });
      ucks.forEach((u) => uckMap.set(u.characterID, u));
    }

    const result: Record<string, CharKnowledgeDTO> = {};
    for (const ch of uniqueChars) {
      const charId = charIdMap.get(ch);
      if (charId === undefined) continue;
      const uck = uckMap.get(charId) ?? null;
      const cd = charDataMap.get(ch);
      result[ch] = {
        status: this.charStatus(uck),
        score: this.charScore(uck),
        pinyin: cd?.pinyin ?? undefined,
        definition: cd?.definition ?? undefined,
        easinessFactor: uck?.easinessFactor,
        repetitions: uck?.repetitions,
      };
    }
    return result;
  }

  private charStatus(uck: UserCharacterKnowledge | null): CharKnowledgeStatus {
    if (!uck || !uck.firstSeenDate) return 'unknown';
    if (!uck.lastReviewDate) return 'seen';
    if (uck.repetitions >= 3 && uck.easinessFactor >= 2.0) return 'learned';
    return 'learning';
  }

  private charScore(uck: UserCharacterKnowledge | null): number {
    if (!uck || !uck.lastReviewDate) return 0;
    const repScore = Math.min(1, uck.repetitions / 5) * 0.6;
    const efScore = Math.min(1, Math.max(0, (uck.easinessFactor - 1.3) / 1.2)) * 0.4;
    return repScore + efScore;
  }
}
