import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // No need to set global prefix since our controllers already have api prefixes
  // and we're using ServeStaticModule to handle SPA routes

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
