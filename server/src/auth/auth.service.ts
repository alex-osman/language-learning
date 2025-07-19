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
    const user = await this.usersService.findUser(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const jwt = await this.jwtService.signAsync({ userId: user.id, email });
    return { access_token: jwt };
  }
}
