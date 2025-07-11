import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Season } from '../entities/season.entity';
import { CreateSeasonDTO } from '../../shared/dto/season.dto';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
  ) {}

  async create(createSeasonDto: CreateSeasonDTO): Promise<Season> {
    const season = this.seasonRepository.create(createSeasonDto);
    return this.seasonRepository.save(season);
  }

  async findAll(): Promise<Season[]> {
    return this.seasonRepository.find();
  }

  async findOne(id: number): Promise<Season | null> {
    return this.seasonRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateDto: Partial<CreateSeasonDTO>,
  ): Promise<Season | null> {
    await this.seasonRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.seasonRepository.delete(id);
  }

  async getSeasonsForMedia(mediaId: number): Promise<Season[]> {
    return this.seasonRepository.find({ where: { media: { id: mediaId } } });
  }
}
