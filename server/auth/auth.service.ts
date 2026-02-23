import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../common/database.service';
import { SupabaseService } from '../supabase/supabase-auth.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async register(data: any) {
    const { email, password, name, role, phone } = data;
    
    const existingUser = this.databaseService.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 1. Create user in Supabase
    const supabaseUser = await this.supabaseAuthService.createUser(email, password, { name, role });

    // 2. Create user in local DB
    const result = this.databaseService.run(
      'INSERT INTO users (supabase_user_id, role, name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [supabaseUser.id, role, name, email, phone]
    );

    const userId = result.lastInsertRowid;

    if (role === 'DRIVER') {
      this.databaseService.run(
        'INSERT INTO drivers (user_id) VALUES (?)',
        [userId]
      );
    }

    return this.login({ email, password });
  }

  async login(credentials: any) {
    const { email, password } = credentials;
    
    // 1. Login via Supabase
    const { session, user: supabaseUser } = await this.supabaseAuthService.signIn(email, password);

    // 2. Find user in local DB
    const user: any = this.databaseService.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      throw new UnauthorizedException('User not found in local database');
    }

    // Update supabase_user_id if not set (for migration)
    if (!user.supabase_user_id) {
      this.databaseService.run('UPDATE users SET supabase_user_id = ? WHERE id = ?', [supabaseUser.id, user.id]);
    }

    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }
}
