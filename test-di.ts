import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './server/app.module';
import { AuthController } from './server/auth/auth.controller';
import { AuthService } from './server/auth/auth.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const controller = app.get(AuthController);
  const service = app.get(AuthService);
  
  console.log('Controller found:', !!controller);
  console.log('Service found:', !!service);
  console.log('Service in controller:', !!(controller as any).authService);
  
  try {
    const result = await controller.login({ email: 'admin@taxilibre.com', password: 'password123' });
    console.log('Login result:', result);
  } catch (err: any) {
    console.error('Login error:', err.message);
  }
  
  await app.close();
}

test();
