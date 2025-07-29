import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Season } from './season.entity';
import { Sentence } from './sentence.entity';

@Entity('episodes')
export class Episode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  season_id: number;

  @ManyToOne(() => Season, (season: Season) => season.episodes)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ type: 'varchar', length: 200 })
  assetUrl: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @OneToMany(() => Sentence, (sentence: Sentence) => sentence.episode)
  sentences: Sentence[];
}
