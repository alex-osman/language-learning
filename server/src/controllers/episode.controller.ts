import { Controller, Get, Param } from '@nestjs/common';
import { EpisodeService } from 'src/services/episode.service';

@Controller('api/episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get(':id/scenes')
  async getScenesForEpisode(@Param('id') id: string) {
    return this.episodeService.getScenesForEpisode(parseInt(id));
  }
}
