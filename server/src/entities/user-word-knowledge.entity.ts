import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Word } from './word.entity';

@Entity('user_word_knowledge')
export class UserWordKnowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userID: number;

  @Column({ type: 'int' })
  wordID: number;

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
  firstSeenDate?: Date;

  @ManyToOne(() => Word)
  @JoinColumn({ name: 'wordID' })
  word?: Word;
}
