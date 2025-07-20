import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SceneDTO } from 'shared/dto/scene.dto';
import { SceneService } from 'src/services/scene.service';

@Controller('api/scenes')
export class SceneController {
  constructor(private readonly sceneService: SceneService) {
    console.log('registered thes cene controller');
  }

  @Get(':id')
  async getScene(@Param('id') id: string): Promise<SceneDTO> {
    const scene = await this.sceneService.findOne(parseInt(id));
    if (!scene) {
      throw new NotFoundException('Scene not found');
    }
    return {
      id: scene.id,
      episodeId: scene.episode.id,
      assetUrl: scene.episode.assetUrl,
      number: scene.number,
      title: scene.title,
      sentences: scene.sentences,
    };
  }
}
