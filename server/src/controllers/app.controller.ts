import { Controller, Get, All, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  private readonly indexPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'client',
    'dist',
    'browser',
    'index.html',
  );

  @Get()
  root(@Res() res: Response) {
    // Serve the index.html for the root path
    res.sendFile(this.indexPath);
  }

  // Specific routes for Angular client-side routing
  @Get('sentences')
  sentences(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  @Get('interactive')
  interactive(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  @Get('french')
  french(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  @Get('memory-palace')
  memoryPalace(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  @Get('phonetics')
  phonetics(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  @Get('flashcards')
  flashcards(@Res() res: Response) {
    res.sendFile(this.indexPath);
  }

  // Fallback for unmatched routes
  @All('*')
  catchAll(@Req() req: Request, @Res() res: Response) {
    // Make sure this doesn't handle /api* paths
    const url = req.originalUrl;
    if (url.startsWith('/api')) {
      res.status(404).send({ message: 'API endpoint not found' });
      return;
    }

    // Serve index.html for any non-API path
    res.sendFile(this.indexPath);
  }
}
