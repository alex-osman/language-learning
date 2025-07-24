import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { CreateEpisodeDTO, EpisodeDTO } from '../../shared/dto/episode.dto';
import { Scene } from 'src/entities/scene.entity';
import { CharacterService } from './character.service';
import { CharacterDTO } from '@shared/interfaces/data.interface';
import { Season } from 'src/entities/season.entity';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
    private characterService: CharacterService,
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

  async getEpisodesForMedia(mediaId: number): Promise<Episode[]> {
    const allSeasons = await this.seasonRepository.find({
      where: { media_id: mediaId },
    });
    return this.episodeRepository.find({
      where: { season_id: In(allSeasons.map((s) => s.id)) },
    });
  }

  async getEpisodesForSeason(seasonId: number): Promise<Episode[]> {
    console.log('getiting episodes for season', seasonId);
    return this.episodeRepository.find({ where: { season_id: seasonId } });
  }

  async getScenesForEpisode(episodeId: number): Promise<EpisodeDTO> {
    const episode = await this.episodeRepository.findOne({
      where: { id: episodeId },
      relations: ['scenes', 'scenes.sentences'],
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

  async getCharactersForEpisode(
    episodeId: number,
    userId: number,
  ): Promise<CharacterDTO[]> {
    // 1. Get episode with all sentences
    const episode = await this.episodeRepository.findOne({
      where: { id: episodeId },
      relations: ['scenes', 'scenes.sentences'],
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    // 2. Extract all Chinese characters from episode sentences
    const allText = episode.scenes
      .map((scene) => scene.sentences?.map((s) => s.sentence).join('') || '')
      .join('');

    // Extract unique Chinese characters using regex
    const uniqueChars = [...new Set(allText.split(''))].filter((char) =>
      /[\u4e00-\u9fff]/.test(char),
    );

    console.log(
      `Found ${uniqueChars.length} unique Chinese characters in episode ${episodeId}`,
    );

    // 3. Get character data for each unique character
    const characterData = await Promise.all(
      uniqueChars.map((char) => this.characterService.findByCharacter(char)),
    );

    // 4. Convert to DTOs with user context
    const validCharacters = characterData.filter((char) => char !== null);
    return Promise.all(
      validCharacters.map((char) =>
        this.characterService.makeCharacterDTO(char!, userId),
      ),
    );
  }
}
