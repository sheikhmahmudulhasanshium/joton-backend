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

// This will cache the server instance for Vercel's warm starts, improving performance.
let cachedServer: Express;

/**
 * A shared function to apply common NestJS app settings.
 * This includes CORS, Swagger, Helmet, and Validation Pipes.
 * @param app The NestExpressApplication instance.
 * @param envSuffix A suffix to add to titles for clarity (e.g., '(Local)').
 */
function configureCommonAppSettings(
  app: NestExpressApplication,
  envSuffix: string = '',
) {
  // Enable CORS - adjust origin as needed for your production frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // --- JOTON Themed Swagger Configuration ---
  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`👨🏻‍⚕️ Joton Backend ${envSuffix}`.trim())
    .setDescription('Healthcare with care')
    .setVersion('1.0')
    .addTag('cats')
    // If you use authentication, uncomment the line below
    // .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  const customSwaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: `Joton API Docs ${envSuffix}`.trim(),
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

  // Basic security with Helmet
  app.use(helmet());

  // Global validation pipe to enforce type safety on DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );
}

/**
 * The bootstrap function for Vercel's serverless environment.
 * It creates the NestJS app, initializes it, and returns the underlying Express server.
 */
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

// --- VERCEL ENTRY POINT ---
// Vercel will use this exported promise that resolves to the Express server.
export default bootstrapServerless();

/**
 * The bootstrap function for local development.
 * It creates a NestJS app and starts it listening on a port.
 */
async function bootstrapLocal() {
  const localApp = await NestFactory.create<NestExpressApplication>(AppModule);
  configureCommonAppSettings(localApp, '(Local)'); // Add suffix for clarity

  const port = process.env.PORT || 3001;
  await localApp.listen(port);

  console.log(
    `🚀 Joton Backend (Local) is running on: http://localhost:${port}`,
  );
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api`);
}

// --- LOCAL DEVELOPMENT STARTUP ---
// This condition checks if we are NOT in a Vercel environment.
if (!process.env.VERCEL) {
  bootstrapLocal().catch((err) => {
    console.error('Error during local bootstrap:', err);
    process.exit(1);
  });
}
