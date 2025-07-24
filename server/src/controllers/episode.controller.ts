import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EpisodeService } from 'src/services/episode.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserID } from 'src/decorators/user.decorator';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Controller('api/episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get(':id/scenes')
  async getScenesForEpisode(@Param('id') id: string) {
    return this.episodeService.getScenesForEpisode(parseInt(id));
  }

  @Get(':id/characters')
  @UseGuards(AuthGuard)
  async getCharactersForEpisode(
    @Param('id') id: string,
    @UserID() userId: number,
  ): Promise<CharacterDTO[]> {
    return this.episodeService.getCharactersForEpisode(parseInt(id), userId);
  }
}
