import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { CreateEpisodeDTO, EpisodeDTO } from '../../shared/dto/episode.dto';
import { Scene } from 'src/entities/scene.entity';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
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

  async getScenesForEpisode(episodeId: number): Promise<EpisodeDTO> {
    const episode = await this.episodeRepository.findOne({
      where: { id: episodeId },
      relations: ['scenes'],
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    return {
      id: episode.id,
      title: episode.title,
      assetUrl: episode.assetUrl,
      scenes: episode.scenes,
    };
  }
}
