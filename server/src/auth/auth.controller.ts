import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { AuthService } from './auth.service';

const smartMap = {
  livingRoom: {
    on: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=f0b8e483-5a96-4c01-afe6-860c506aceec&token=733f54ec-e155-4e42-8b59-88f82e44841f&response=json',
    off: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=53fc9aa6-b731-49cf-a6ab-144618d25d4f&token=6bb55bf0-e95d-4725-8286-d717ac6111ae&response=json',
  },
  rocketLamp: {
    on: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=7e0bf1de-db8c-407e-86ed-ac2c60e0ee45&token=d15596b9-2229-4bf2-9b60-7f744603603c&response=json',
    off: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=8c22e326-0bc0-4e7d-b903-9f6eb695644f&token=df4ca9a3-1ec9-4a83-9a2e-3090d3e355cc&response=json',
  },
  shelfLamp: {
    on: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=c63e3f92-00b1-4c30-9f70-002cba7648f2&token=4aac9b06-b056-449c-8da8-d77d28d53dd5&response=json',
    off: 'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=5c01c9d9-84db-4a83-98c5-fe3a12afe1e3&token=5df4f9d5-c057-480f-9ca3-839f7d043a22&response=json',
  },
};

@Controller('api/auth')
export class AuthController {
  private count = 0;
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

  @Public()
  @Get('switch')
  async switchThing() {
    brightnessButton();
    const { rocketLamp, shelfLamp } = smartMap;
    fetch(rocketLamp.on);
    fetch(shelfLamp.on);

    return {
      count: this.count,
    };
  }
}

// this will mimic a curl request
const brightnessButton = () => {
  const token =
    'cd85963f99405e21d15a7e9aee362bdb2dfee4a507335db144ff6e57b109a24a';
  return fetch('https://api.lifx.com/v1/lights/all/cycle', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      states: [
        { power: 'on', brightness: 0.5, color: 'kelvin:2700', duration: 0.5 },
        { power: 'on', brightness: 0.7, color: 'kelvin:2700', duration: 0.5 },
        { power: 'on', brightness: 0.85, color: 'kelvin:2700', duration: 0.5 },
        { power: 'on', brightness: 1, color: 'kelvin:2700', duration: 0.5 },
      ],
      direction: 'forward',
    }),
  });
};
