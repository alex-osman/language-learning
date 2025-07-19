import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string): Promise<{ access_token: string }> {
    let user = await this.usersService.findUser(email);
    if (!user) {
      user = await this.usersService.createUser(email);
    }
    const jwt = await this.jwtService.signAsync({ userId: user.id, email });
    return { access_token: jwt };
  }
}
