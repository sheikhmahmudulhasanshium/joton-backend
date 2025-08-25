import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Express } from 'express';

// NOTE: We no longer need to import 'join' from 'path' in this file.

let cachedServer: Express;

function configureCommonAppSettings(
  app: NestExpressApplication,
  envSuffix: string = '',
) {
  // REMOVED: The app.useStaticAssets(...) line is no longer needed here.
  // The ServeStaticModule in app.module.ts now handles this.

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`👨🏻‍⚕️ Joton Backend ${envSuffix}`.trim())
    .setDescription('Healthcare with care')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  const customSwaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: `Joton API Docs ${envSuffix}`.trim(),
    customfavIcon: '/favicon.ico', // This line is still very important
    customCss: `
      .swagger-ui .topbar { background-color: #2E3B4E; } /* Dark/Slate */
      .swagger-ui .topbar .link { color: #FFFFFF; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4CBCCC; } /* Teal/Primary */
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3A6AA9; } /* Secondary */
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #FFB27C; } /* Warm */
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #a93a3a; } /* A complementary red for delete */
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #FFB27C; opacity: 0.7; }
    `,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };

  SwaggerModule.setup('api', app, document, customSwaggerOptions);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

// ... The rest of this file remains exactly the same ...
async function bootstrapServerless(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureCommonAppSettings(app);
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default bootstrapServerless();

async function bootstrapLocal() {
  const localApp = await NestFactory.create<NestExpressApplication>(AppModule);
  configureCommonAppSettings(localApp, '(Local)');
  const port = process.env.PORT || 3001;
  await localApp.listen(port);
  console.log(
    `🚀 Joton Backend (Local) is running on: http://localhost:${port}`,
  );
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api`);
}

if (!process.env.VERCEL) {
  bootstrapLocal().catch((err) => {
    console.error('Error during local bootstrap:', err);
    process.exit(1);
  });
}
