import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  character: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pinyin: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  definition: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  radicals: string;

  @Column({ type: 'text', nullable: true })
  movie: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imgUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  learnedDate: Date;

  @Column({ type: 'int', default: 0 })
  freq: number;

  // Spaced Repetition Fields
  @Column({ type: 'float', default: 2.5 })
  easinessFactor: number;

  @Column({ type: 'int', default: 0 })
  repetitions: number;

  @Column({ type: 'int', default: 0 })
  interval: number;

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReviewDate: Date;
}
