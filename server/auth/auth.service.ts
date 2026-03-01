import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../common/database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const email = data.email.toLowerCase();
    console.log('Registering user:', email);
    const { password, name, role, phone, language, country, driverType, taxiLicense, vtcLicense } = data;
    
    const existingUser = this.databaseService.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log('Registration failed: Email already registered', email);
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = this.databaseService.run(
      'INSERT INTO users (role, name, email, phone, password_hash, language, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [role, name, email, phone, passwordHash, language || 'fr', country]
    );

    const userId = result.lastInsertRowid;
    console.log('User created with ID:', userId);

    if (role === 'DRIVER') {
      this.databaseService.run(
        'INSERT INTO drivers (user_id, driver_type, taxi_license_number, vtc_license_number) VALUES (?, ?, ?, ?)',
        [userId, driverType || 'VTC', taxiLicense, vtcLicense]
      );
      console.log('Driver profile created for user:', userId);
    }

    return this.login({ email, password });
  }

  async login(credentials: any) {
    const email = credentials.email.toLowerCase();
    console.log('Login attempt for:', email);
    const { password } = credentials;
    
    const user: any = this.databaseService.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      console.log('Login failed: User not found', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Login successful for:', email);
    const payload = { sub: user.id, email: user.email, role: user.role };

    try {
      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          language: user.language,
          country: user.country,
        },
      };
    } catch (jwtError: any) {
      console.error('JWT Signing Error:', jwtError);
      throw new UnauthorizedException(`Login failed: ${jwtError.message}`);
    }
  }

  async validateUser(userId: number) {
    return this.databaseService.get('SELECT id, name, email, role, status FROM users WHERE id = ?', [userId]);
  }
}
