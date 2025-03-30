import { Controller, Get, All, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  root(@Res() res: Response) {
    // Serve the index.html for the root path
    res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'client',
        'dist',
        'browser',
        'index.html',
      ),
    );
  }

  // Using @All('*') with a very low priority to ensure all other routes are matched first
  // This should be the last route to be evaluated
  @All('*')
  catchAll(@Res() res: Response) {
    // Make sure this doesn't handle /api* paths (although those should be handled by their own controllers first)
    const url = res.req.originalUrl;
    if (url.startsWith('/api')) {
      res.status(404).send({ message: 'API endpoint not found' });
      return;
    }

    // Serve the index.html for any non-API path that doesn't match server-side routes
    // This allows Angular's router to handle client-side routing
    res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'client',
        'dist',
        'browser',
        'index.html',
      ),
    );
  }
}
