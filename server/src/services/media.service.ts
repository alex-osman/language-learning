import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../entities/media.entity';
import { CreateMediaDTO, MediaDTO } from '../../shared/dto/media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDTO): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return this.mediaRepository.save(media);
  }

  async findAll(): Promise<Media[]> {
    return this.mediaRepository.find();
  }

  async findOne(id: number): Promise<Media | null> {
    return this.mediaRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateDto: Partial<CreateMediaDTO>,
  ): Promise<Media | null> {
    await this.mediaRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.mediaRepository.delete(id);
  }
}
