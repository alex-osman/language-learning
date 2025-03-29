import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.RDS_URL || 'localhost',
  port: parseInt(process.env.RDS_PORT || '3306', 10),
  username: process.env.RDS_USER || 'root',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.RDS_DB || 'language_learning',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // logging: process.env.NODE_ENV !== 'production',
};
