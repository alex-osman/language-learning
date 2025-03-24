import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { DataService } from './services/data.service';
import { DataController } from './controllers/data.controller';

@Module({
  imports: [ConfigModule.forRoot(), AiModule],
  controllers: [AppController, DataController],
  providers: [AppService, DataService],
})
export class AppModule {}
