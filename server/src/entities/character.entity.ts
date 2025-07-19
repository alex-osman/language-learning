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

  @Column({ type: 'int', default: 0 })
  freq: number;
}
