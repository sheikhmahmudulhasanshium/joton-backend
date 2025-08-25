// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// --- IMPORT THESE ---
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // 1. Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true, // Make env variables available throughout the app
    }),

    // 2. Connect to MongoDB using the URI from the .env file
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      // FIX 1: Removed the unnecessary 'async' keyword here
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Your existing ServeStaticModule is kept
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),

    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
