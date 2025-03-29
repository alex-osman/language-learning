import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Set } from '../entities/set.entity';
import { SetDTO, ToneLocation } from '../shared/interfaces/data.interface';

@Injectable()
export class SetService {
  constructor(
    @InjectRepository(Set)
    private setRepository: Repository<Set>,
  ) {}

  mapLocations(set: Set): ToneLocation[] {
    return [
      set.toneLocationName1
        ? {
            name: set.toneLocationName1,
            description: set.toneLocationDescription1,
            toneNumber: 1,
          }
        : null,
      set.toneLocationName2
        ? {
            name: set.toneLocationName2,
            description: set.toneLocationDescription2,
            toneNumber: 2,
          }
        : null,
      set.toneLocationName3
        ? {
            name: set.toneLocationName3,
            description: set.toneLocationDescription3,
            toneNumber: 3,
          }
        : null,
      set.toneLocationName4
        ? {
            name: set.toneLocationName4,
            description: set.toneLocationDescription4,
            toneNumber: 4,
          }
        : null,
      set.toneLocationName5
        ? {
            name: set.toneLocationName5,
            description: set.toneLocationDescription5,
            toneNumber: 5,
          }
        : null,
    ].filter(Boolean) as ToneLocation[];
  }

  async findAll(): Promise<SetDTO[]> {
    const allSets = await this.setRepository.find();
    return allSets.map((set) => {
      const toneLocations = this.mapLocations(set);
      return {
        id: set.id,
        final: set.final,
        name: set.name,
        description: set.description,
        toneLocations,
      };
    });
  }

  async findOne(id: number): Promise<Set | null> {
    return this.setRepository.findOne({
      where: { id },
      relations: ['toneLocations'],
    });
  }

  async findByFinal(final: string): Promise<SetDTO | null> {
    let set = await this.setRepository.findOne({
      where: { final },
    });
    if (!set) {
      set = await this.setRepository.findOne({
        where: { final: 'null' },
      });
    }
    if (!set) return null;
    return {
      id: set.id,
      final: set.final,
      name: set.name,
      description: set.description,
      toneLocations: this.mapLocations(set),
    };
  }
}
