import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { CreateEpisodeDTO } from '../../shared/dto/episode.dto';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
  ) {}

  async create(createEpisodeDto: CreateEpisodeDTO): Promise<Episode> {
    const episode = this.episodeRepository.create(createEpisodeDto);
    return this.episodeRepository.save(episode);
  }

  async findAll(): Promise<Episode[]> {
    return this.episodeRepository.find();
  }

  async findOne(id: number): Promise<Episode | null> {
    return this.episodeRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateDto: Partial<CreateEpisodeDTO>,
  ): Promise<Episode | null> {
    await this.episodeRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.episodeRepository.delete(id);
  }

  async getEpisodesForSeason(seasonId: number): Promise<Episode[]> {
    return this.episodeRepository.find({ where: { season: { id: seasonId } } });
  }
}
