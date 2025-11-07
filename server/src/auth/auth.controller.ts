import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { AuthService } from './auth.service';

const token =
  'cd85963f99405e21d15a7e9aee362bdb2dfee4a507335db144ff6e57b109a24a';

const smartMap = {
  scenes: {
    everythingOff: '0852b6a6-181c-4648-a20f-243659a6410c',
    everythingWarm: '378d3a03-3c5d-4cb0-aeee-2929f4b5fc48',
    warmBubbles: 'da51d175-4c26-42ab-865a-0ae5660355ae',
  },
  livingRoom: {
    on: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=f0b8e483-5a96-4c01-afe6-860c506aceec&token=733f54ec-e155-4e42-8b59-88f82e44841f&response=json',
      ),
    off: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=53fc9aa6-b731-49cf-a6ab-144618d25d4f&token=6bb55bf0-e95d-4725-8286-d717ac6111ae&response=json',
      ),
  },
  rocketLamp: {
    on: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=7e0bf1de-db8c-407e-86ed-ac2c60e0ee45&token=d15596b9-2229-4bf2-9b60-7f744603603c&response=json',
      ),
    off: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=8c22e326-0bc0-4e7d-b903-9f6eb695644f&token=df4ca9a3-1ec9-4a83-9a2e-3090d3e355cc&response=json',
      ),
  },
  shelfLamp: {
    on: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=c63e3f92-00b1-4c30-9f70-002cba7648f2&token=4aac9b06-b056-449c-8da8-d77d28d53dd5&response=json',
      ),
    off: () =>
      fetch(
        'https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=5c01c9d9-84db-4a83-98c5-fe3a12afe1e3&token=5df4f9d5-c057-480f-9ca3-839f7d043a22&response=json',
      ),
  },
};

@Controller('api/auth')
export class AuthController {
  private brightnessCount = 0;
  private sceneCount = 0;
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
  @Get('switch/:param')
  async switchThing(@Param('param') param: string) {
    if (param === 'brightness') {
      brightnessButton();
      const { rocketLamp, shelfLamp } = smartMap;
      this.brightnessCount % 3 === 0 ? rocketLamp.off() : rocketLamp.on();
      this.brightnessCount % 3 === 0 ? shelfLamp.off() : shelfLamp.on();
      this.brightnessCount++;
    } else if (param === 'sceneButton') {
      sceneButton(this.sceneCount++);
    } else if (param === 'shelfLamp') {
    }

    return {
      brightnessCount: this.brightnessCount,
    };
  }
}

// this will mimic a curl request
const brightnessButton = () => {
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

const sceneButton = (count: number) => {
  const scenes = [
    {
      rocketLamp: 'on',
      shelfLamp: 'on',
      scene: smartMap.scenes.everythingWarm,
    },
    {
      rocketLamp: 'on',
      shelfLamp: 'on',
      scene: smartMap.scenes.everythingOff,
    },
    {
      rocketLamp: 'on',
      shelfLamp: 'on',
      scene: smartMap.scenes.warmBubbles,
    },
  ];
  const scene = scenes[count % scenes.length];
  scene.rocketLamp === 'on'
    ? smartMap.rocketLamp.on()
    : smartMap.rocketLamp.off();
  scene.shelfLamp === 'on' ? smartMap.shelfLamp.on() : smartMap.shelfLamp.off();

  const url = `https://api.lifx.com/v1/scenes/scene_id:${scene.scene}/activate`;
  return fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ duration: 1, fast: false }),
  });
};
