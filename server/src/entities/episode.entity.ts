import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Scene } from './scene.entity';
import { Season } from './season.entity';

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

  @Column({ type: 'int' })
  knownCache: number;

  @OneToMany(() => Scene, (scene: Scene) => scene.episode)
  scenes: Scene[];
}
