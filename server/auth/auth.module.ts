import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseService } from '../common/database.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, DatabaseService, JwtModule, JwtAuthGuard],
})
export class AuthModule {
  constructor() {
    console.log('AuthModule initialized');
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    console.log('JWT Secret loaded:', secret === 'super-secret-key' ? 'using default' : 'using env var');
  }
}
