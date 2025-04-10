import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: false })
  word: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pinyin: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  definition: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  frequencyRank: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
