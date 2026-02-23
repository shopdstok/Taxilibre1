import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    if (supabaseServiceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
  }

  getClient() {
    return this.supabase;
  }

  getAdminClient() {
    return this.supabaseAdmin || this.supabase;
  }

  async verifyToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) {
      throw new UnauthorizedException('Invalid Supabase token');
    }
    return user;
  }

  async createUser(email: string, password: string, metadata: any = {}) {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase Service Role Key is required for admin operations');
    }

    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true
    });

    if (error) {
      throw new Error(`Supabase user creation failed: ${error.message}`);
    }

    return data.user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(`Supabase login failed: ${error.message}`);
    }

    return data;
  }
}
