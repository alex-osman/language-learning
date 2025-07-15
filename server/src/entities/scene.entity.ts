import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Episode } from './episode.entity';
import { Sentence } from './sentence.entity';

@Entity('scenes')
export class Scene {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Episode, (episode: Episode) => episode.scenes)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 200 })
  assetUrl: string;

  @OneToMany(() => Sentence, (sentence: Sentence) => sentence.scene)
  sentences: Sentence[];
}
