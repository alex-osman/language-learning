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
  @JoinColumn({ name: 'seasonId' })
  season: Season;

  @ManyToOne(() => Media, (media: Media) => media.episodes, { nullable: true })
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'int' })
  number: number;

  @OneToMany(() => Scene, (scene: Scene) => scene.episode)
  scenes: Scene[];
}
