import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Media } from './media.entity';
import { Episode } from './episode.entity';

@Entity('seasons')
export class Season {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Media, (media: Media) => media.seasons)
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'int' })
  number: number;

  @OneToMany(() => Episode, (episode: Episode) => episode.season)
  episodes: Episode[];
}
