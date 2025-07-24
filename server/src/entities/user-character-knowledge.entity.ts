import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity('user_character_knowledge')
export class UserCharacterKnowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userID: number;

  @Column({ type: 'int' })
  characterID: number;

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
  learnedDate?: Date;

  // NEW: Track when character was first encountered/seen
  @Column({ type: 'timestamp', nullable: true })
  firstSeenDate?: Date;

  @Column({ type: 'text', nullable: true })
  movie: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imgUrl: string;

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'characterID' })
  character?: Character;
}
