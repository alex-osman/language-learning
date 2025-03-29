import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RadicalProp } from '../entities/radical-prop.entity';
import { RadicalProp as RadicalPropDTO } from '@shared/interfaces/data.interface';

@Injectable()
export class RadicalPropService {
  constructor(
    @InjectRepository(RadicalProp)
    private radicalPropRepository: Repository<RadicalProp>,
  ) {}

  async findAll(): Promise<RadicalPropDTO[]> {
    return this.radicalPropRepository.find();
  }

  async findOne(id: number): Promise<RadicalProp | null> {
    return this.radicalPropRepository.findOne({ where: { id } });
  }

  async findByRadical(radical: string): Promise<RadicalProp | null> {
    return this.radicalPropRepository.findOne({ where: { radical } });
  }

  async create(radicalProp: Partial<RadicalProp>): Promise<RadicalProp> {
    const newRadicalProp = this.radicalPropRepository.create(radicalProp);
    return this.radicalPropRepository.save(newRadicalProp);
  }

  async update(
    id: number,
    radicalProp: Partial<RadicalProp>,
  ): Promise<RadicalProp | null> {
    await this.radicalPropRepository.update(id, radicalProp);
    return this.radicalPropRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.radicalPropRepository.delete(id);
  }

  // Method to import data from JSON
  async importFromJson(radicalProps: Partial<RadicalProp>[]): Promise<void> {
    // Clear existing data
    await this.radicalPropRepository.clear();

    // Create new radical props
    const newRadicalProps = this.radicalPropRepository.create(radicalProps);
    await this.radicalPropRepository.save(newRadicalProps);
  }
}
