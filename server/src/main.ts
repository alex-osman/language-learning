import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // API routes are handled by controllers

  // Serve static files
  expressApp.use(
    express.static(join(__dirname, '..', '..', 'client', 'dist', 'browser')),
  );

  // Fallback route for SPA - this needs to be after all API routes
  expressApp.get('*', (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
      return next();
    }
    // Serve the index.html for all other routes (SPA client routes)
    res.sendFile(
      join(__dirname, '..', '..', 'client', 'dist', 'browser', 'index.html'),
    );
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
