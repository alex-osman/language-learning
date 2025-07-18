import { Controller, Get, Param } from '@nestjs/common';
import { SceneService } from 'src/services/scene.service';

@Controller('api/scenes')
export class SceneController {
  constructor(private readonly sceneService: SceneService) {
    console.log('registered thes cene controller');
  }

  @Get(':id')
  async getScene(@Param('id') id: string) {
    return this.sceneService.findOne(parseInt(id));
  }
}
