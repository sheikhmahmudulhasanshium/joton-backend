// src/main.ts

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
// ES Module syntax for importing a CommonJS module
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');

let cachedServer: Express;

function configureCommonAppSettings(
  app: NestExpressApplication,
  envSuffix = '',
) {
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // --- START: THE DEFINITIVE HELMET & SWAGGER CONFIG ---

  // Apply Helmet with a CSP that allows the Cloudflare CDN for Swagger assets
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'validator.swagger.io'],
          // Allow scripts from self and the Cloudflare CDN
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
          ],
          // Allow styles from self and the Cloudflare CDN
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
          ],
        },
      },
    }),
  );

  app.use(cookieParser());

  // Restore the global prefix. This is the cleanest way to manage API routes.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`👨🏻‍⚕️ Joton Backend ${envSuffix}`.trim())
    .setDescription('Healthcare with hope.')
    .setVersion('1.0')
    .addTag('Api Endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  // Configure Swagger to use the external CDN assets, just like cirql-backend
  const customSwaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: `Joton API Docs ${envSuffix}`.trim(),
    customfavIcon: '/favicon.ico',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCss: `
      .swagger-ui .topbar { background-color: #2E3B4E; }
      .swagger-ui .topbar .link { color: #FFFFFF; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4CBCCC; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3A6AA9; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #FFB27C; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #a93a3a; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #FFB27C; opacity: 0.7; }
    `,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };

  // Setup Swagger on the '/api' path. This will conflict with the global prefix
  // for the UI page itself, but the assets will load externally, fixing the issue.
  SwaggerModule.setup('api', app, document, customSwaggerOptions);

  // --- END: THE DEFINITIVE HELMET & SWAGGER CONFIG ---
}

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

export default bootstrapServerless();
