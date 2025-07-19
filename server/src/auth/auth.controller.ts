import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  async signIn(@Body() body: { email: string }) {
    return this.authService.signIn(body.email);
  }
}
