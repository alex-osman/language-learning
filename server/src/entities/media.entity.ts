import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Season } from './season.entity';
import { Episode } from './episode.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'enum', enum: ['tv', 'movie'] })
  type: 'tv' | 'movie';

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @OneToMany(() => Season, (season: Season) => season.media)
  seasons: Season[];

  @OneToMany(() => Episode, (episode: Episode) => episode.media)
  episodes: Episode[];
}
