import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Episode } from './episode.entity';
import { UserSentenceKnowledge } from './user-sentence-knowledge.entity';

@Entity('sentences')
export class Sentence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  sentence: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  pinyin: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  translation: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  audioUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string;

  @Column({ type: 'int', nullable: true })
  level: number;

  // Spaced Repetition Fields
  @Column({ type: 'float', default: 2.5 })
  easinessFactor: number;

  @Column({ type: 'int', nullable: true })
  repetitions: number;

  @Column({ type: 'int', nullable: true })
  interval: number;

  @Column({ type: 'int', nullable: true })
  startMs: number;

  @Column({ type: 'int', nullable: true })
  endMs: number;

  @Column({ type: 'date', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'date', nullable: true })
  lastReviewDate: Date;

  @OneToMany(
    () => UserSentenceKnowledge,
    (userSentenceKnowledge) => userSentenceKnowledge.sentence,
  )
  userSentenceKnowledge: UserSentenceKnowledge[];

  @ManyToOne(() => Episode, (episode) => episode.sentences, { nullable: true })
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}
