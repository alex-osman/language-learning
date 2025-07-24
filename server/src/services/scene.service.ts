import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene } from '../entities/scene.entity';
import { CreateSceneDTO } from '../../shared/dto/scene.dto';

@Injectable()
export class SceneService {
  constructor(
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
  ) {}

  async create(createSceneDto: CreateSceneDTO): Promise<Scene> {
    // Handle episodeId by mapping it to episode relation
    const sceneData: any = { ...createSceneDto };
    if (createSceneDto.episodeId) {
      sceneData.episode = { id: createSceneDto.episodeId };
      delete sceneData.episodeId; // Remove episodeId since we're using episode relation
    }

    const scene = this.sceneRepository.create(sceneData);
    const savedScene = await this.sceneRepository.save(scene);

    // If it's an array (shouldn't happen with single entity), return the first item
    return Array.isArray(savedScene) ? savedScene[0] : savedScene;
  }

  async findAll(): Promise<Scene[]> {
    return this.sceneRepository.find();
  }

  async findOne(id: number): Promise<Scene | null> {
    return this.sceneRepository.findOne({
      where: { id },
      relations: ['sentences', 'episode'],
    });
  }

  async update(
    id: number,
    updateDto: Partial<CreateSceneDTO>,
  ): Promise<Scene | null> {
    await this.sceneRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.sceneRepository.delete(id);
  }

  async getScenesForEpisode(episodeId: number): Promise<Scene[]> {
    return this.sceneRepository.find({
      where: { episode: { id: episodeId } },
      relations: ['episode'],
    });
  }
}
