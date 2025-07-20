import { Controller, Get, Param } from '@nestjs/common';
import { EpisodeService } from 'src/services/episode.service';

@Controller('api/seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: EpisodeService) {}

  @Get(':id/episodes')
  async getEpisodesForSeason(@Param('id') id: string) {
    return this.seasonsService.getEpisodesForSeason(parseInt(id));
  }
}
