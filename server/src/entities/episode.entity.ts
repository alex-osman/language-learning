import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Season } from './season.entity';
import { Media } from './media.entity';
import { Scene } from './scene.entity';

@Entity('episodes')
export class Episode {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Season, (season: Season) => season.episodes)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ type: 'varchar', length: 200 })
  assetUrl: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'int' })
  knownCache: number;

  @OneToMany(() => Scene, (scene: Scene) => scene.episode)
  scenes: Scene[];
}
