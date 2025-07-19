import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('login')
  async signIn(@Body() body: { email: string }) {
    return this.authService.signIn(body.email);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }
}
