import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { Character } from './entities/character.entity';
import { RadicalProp } from './entities/radical-prop.entity';
import { CharacterService } from './services/character.service';
import { RadicalPropService } from './services/radical-prop.service';
import { CharacterController } from './controllers/character.controller';
import { AiModule } from './ai/ai.module';
import { DataController } from './controllers/data.controller';
import { DataService } from './services/data.service';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Character, RadicalProp]),
  ],
  controllers: [AppController, DataController, CharacterController],
  providers: [AppService, CharacterService, RadicalPropService, DataService],
})
export class AppModule {}
