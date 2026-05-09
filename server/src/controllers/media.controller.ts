import { Controller, Get } from '@nestjs/common';
import { MediaService } from '../services/media.service';
import { Media } from '../entities/media.entity';

@Controller('api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getAllMedia(): Promise<Media[]> {
    return this.mediaService.findAll();
  }
}
