import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor } from '../entities/actor.entity';
import { Actor as ActorDTO } from '../shared/interfaces/data.interface';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
  ) {}

  async findAll(): Promise<ActorDTO[]> {
    return this.actorRepository.find();
  }

  async findOne(id: number): Promise<Actor | null> {
    return this.actorRepository.findOne({ where: { id } });
  }

  async findByInitial(initial: string): Promise<Actor | null> {
    return this.actorRepository.findOne({ where: { initial } });
  }

  async create(actor: Partial<Actor>): Promise<Actor> {
    const newActor = this.actorRepository.create(actor);
    return this.actorRepository.save(newActor);
  }

  async update(id: number, actor: Partial<Actor>): Promise<Actor | null> {
    await this.actorRepository.update(id, actor);
    return this.actorRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.actorRepository.delete(id);
  }
}
