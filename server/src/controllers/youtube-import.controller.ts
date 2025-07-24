import { Body, Controller, Post } from '@nestjs/common';
import { YouTubeImportService } from '../services/youtube-import.service';
import { CreateYouTubeImportDTO } from '../../shared/dto/youtube-import.dto';

@Controller('api/youtube-import')
export class YouTubeImportController {
  constructor(private readonly youtubeImportService: YouTubeImportService) {}

  @Post()
  async importFromYouTube(
    @Body() createYouTubeImportDto: CreateYouTubeImportDTO,
  ) {
    return this.youtubeImportService.importFromYouTube(createYouTubeImportDto);
  }
}
