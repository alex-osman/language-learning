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

  @Column({ type: 'int' })
  easinessFactor: number;

  @Column({ type: 'int' })
  repetitions: number;

  @Column({ type: 'int' })
  interval: number;

  @Column({ type: 'timestamp' })
  lastReviewDate: Date;

  @Column({ type: 'timestamp' })
  nextReviewDate: Date;

  @Column({ type: 'timestamp' })
  learnedDate: Date;

  @Column({ type: 'text', nullable: true })
  movie: string;

  @Column({ type: 'text', nullable: true })
  imgUrl: string;

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'character_id' })
  character: Character;
}
