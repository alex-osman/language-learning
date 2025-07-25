import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sentence } from './sentence.entity';

@Entity('user_sentence_knowledge')
@Index(['userID', 'comprehensionPercentage']) // For fast filtering by user and comprehension level
export class UserSentenceKnowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userID: number;

  @Column({ type: 'int' })
  sentenceID: number;

  @Column({ type: 'float' })
  comprehensionPercentage: number; // 0-100, percentage of characters known in this sentence

  @Column({ type: 'int' })
  totalUniqueCharacters: number; // Total unique Chinese characters in the sentence

  @Column({ type: 'int' })
  knownCharacters: number; // Number of characters the user knows

  @Column({ type: 'int' })
  unknownCharacters: number; // Number of characters the user doesn't know

  @Column({ type: 'timestamp' })
  calculatedAt: Date; // When this comprehension was last calculated

  // Spaced repetition fields (following UserCharacterKnowledge pattern)
  @Column({ type: 'float', default: 2.5 })
  easinessFactor: number;

  @Column({ type: 'int', default: 0 })
  repetitions: number;

  @Column({ type: 'int', default: 0 })
  interval: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReviewDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  firstSeenDate?: Date; // When user first encountered this sentence

  @ManyToOne(() => Sentence)
  @JoinColumn({ name: 'sentenceID' })
  sentence?: Sentence;
}
