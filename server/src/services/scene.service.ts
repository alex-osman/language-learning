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
    const scene = this.sceneRepository.create(createSceneDto);
    return this.sceneRepository.save(scene);
  }

  async findAll(): Promise<Scene[]> {
    return this.sceneRepository.find();
  }

  async findOne(id: number): Promise<Scene | null> {
    return this.sceneRepository.findOne({
      where: { id },
      relations: ['sentences'],
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
    return this.sceneRepository.find({ where: { episode: { id: episodeId } } });
  }
}
