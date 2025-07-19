import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserOrFail(userId: number): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  async findUser(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async createUser(email: string): Promise<User> {
    const user = this.userRepository.create({ email });
    return this.userRepository.save(user);
  }
}
