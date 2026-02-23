import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase-auth.service';
import { DatabaseService } from '../common/database.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private databaseService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      // 1. Verify token with Supabase
      const supabaseUser = await this.supabaseService.verifyToken(token);

      // 2. Map Supabase user to local user
      const user: any = this.databaseService.get(
        'SELECT id, role, email, status FROM users WHERE supabase_user_id = ?',
        [supabaseUser.id]
      );

      if (!user) {
        throw new UnauthorizedException('User not found in local database');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('User account is suspended');
      }

      // 3. Attach user to request
      request.user = {
        userId: user.id,
        supabaseId: supabaseUser.id,
        email: user.email,
        role: user.role
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }
}
