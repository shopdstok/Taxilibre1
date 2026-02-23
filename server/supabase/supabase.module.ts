import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase-auth.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
