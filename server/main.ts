import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

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

  // Integrate Vite for frontend
  const server = app.getHttpAdapter().getInstance();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use(vite.middlewares);
  } else {
    server.use(express.static(join(process.cwd(), 'dist')));
  }

  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger documentation available at: http://localhost:3000/docs`);
}

bootstrap();
