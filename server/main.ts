import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { join } from 'path';
import { WsAdapter } from '@nestjs/platform-ws';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useWebSocketAdapter(new WsAdapter(app));
  
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Request logging
  app.use((req: any, res: any, next: any) => {
    console.log(`[Incoming Request] ${req.method} ${req.url}`);
    next();
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Integrate Vite for frontend BEFORE NestJS routes
  const server = app.getHttpAdapter().getInstance();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use(async (req: any, res: any, next: any) => {
      const url = req.originalUrl || req.url;
      if (url.startsWith('/api') || url.startsWith('/docs')) {
        next();
      } else {
        vite.middlewares(req, res, next);
      }
    });
  } else {
    server.use(express.static(join(process.cwd(), 'dist')));
    // Handle SPA fallback in production
    server.get('*', (req: any, res: any, next: any) => {
      const url = req.originalUrl || req.url;
      if (url.startsWith('/api') || url.startsWith('/docs')) {
        next();
      } else {
        res.sendFile(join(process.cwd(), 'dist', 'index.html'));
      }
    });
  }

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('TaxiLibre API')
    .setDescription('The TaxiLibre ride-sharing platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger documentation available at: http://localhost:3000/docs`);
}

bootstrap();
