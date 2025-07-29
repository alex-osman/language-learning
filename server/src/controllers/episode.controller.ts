import { Controller, Get, Param, UseGuards, Delete } from '@nestjs/common';
import { EpisodeService } from 'src/services/episode.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserID } from 'src/decorators/user.decorator';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Controller('api/episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get(':mediaId/media-episodes')
  async getEpisodesForMedia(@Param('mediaId') mediaId: string) {
    return this.episodeService.getEpisodesForMedia(parseInt(mediaId));
  }

  @Get(':id/sentences')
  async getEpisodeWithSentences(@Param('id') id: string) {
    return this.episodeService.getEpisodeWithSentences(parseInt(id));
  }

  @Get(':id/characters')
  @UseGuards(AuthGuard)
  async getCharactersForEpisode(
    @Param('id') id: string,
    @UserID() userId: number,
  ): Promise<CharacterDTO[]> {
    return this.episodeService.getCharactersForEpisode(parseInt(id), userId);
  }

  @Delete(':id')
  async deleteEpisode(@Param('id') id: string): Promise<{ message: string }> {
    await this.episodeService.deleteEpisodeWithCascade(parseInt(id));
    return { message: 'Episode deleted successfully' };
  }

  @Get(':id/progress')
  @UseGuards(AuthGuard)
  async getEpisodeProgress(@Param('id') id: string, @UserID() userId: number) {
    return this.episodeService.getEpisodeProgress(parseInt(id), userId);
  }
}
