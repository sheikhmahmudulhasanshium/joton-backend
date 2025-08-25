import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express'; // <-- IMPORT Request and Response

let cachedServer: Express;

function configureCommonAppSettings(
  app: NestExpressApplication,
  envSuffix: string = '',
) {
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // --- STEP 1: Generate the Swagger Document Object ---
  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`👨🏻‍⚕️ Joton Backend ${envSuffix}`.trim())
    .setDescription('Healthcare with care')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  // --- STEP 2: Create a DEDICATED endpoint to serve the JSON document ---
  // THIS IS THE FIX: We get the underlying Express instance to define the route.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api-json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // --- STEP 3: Configure the Swagger UI to FETCH the JSON from our endpoint ---
  const swaggerUiOptions = {
    customSiteTitle: `Joton API Docs ${envSuffix}`.trim(),
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      url: '/api-json', // Tell the UI where to get its data
    },
    customCss: `
      .swagger-ui .topbar { background-color: #2E3B4E; }
      .swagger-ui .topbar .link { color: #FFFFFF; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4CBCCC; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3A6AA9; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #FFB27C; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #a93a3a; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #FFB27C; opacity: 0.7; }
    `,
  };

  app.use('/api', swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));

  // --- The rest of the configuration is the same ---
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

// ... The rest of the file remains unchanged ...
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
