import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase-auth.service';

export interface Location {
  lat: number;
  lng: number;
  lastUpdate: string;
}

@Injectable()
export class DriverLocationService {
  constructor(private supabaseService: SupabaseService) {}

  async updateLocation(userId: number, lat: number, lng: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get the supabase_user_id for this user
    // In a real app, we might have this in the request user object already
    // For now, we'll assume we need to use the supabase_user_id
    
    // We need to map local userId to supabase UUID
    // Actually, the JwtAuthGuard already attaches supabaseId to req.user
    // But updateLocation is called with userId.
    
    // Let's modify the controller to pass supabaseId if available, 
    // or we fetch it here.
    
    // For simplicity, let's assume we use the supabaseId passed from controller
    // I'll update the controller next.
  }

  async updateLocationWithSupabaseId(supabaseId: string, lat: number, lng: number, isAvailable: boolean = true) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data, error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: supabaseId,
        lat,
        lng,
        last_update: new Date().toISOString(),
        is_available: isAvailable
      }, { onConflict: 'driver_id' });

    if (error) {
      console.error('Error updating driver location in Supabase:', error);
      throw new Error('Failed to update location');
    }

    return { lat, lng, lastUpdate: new Date().toISOString() };
  }

  async getLocationBySupabaseId(supabaseId: string): Promise<Location | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('driver_locations')
      .select('lat, lng, last_update')
      .eq('driver_id', supabaseId)
      .single();

    if (error || !data) return null;

    return {
      lat: data.lat,
      lng: data.lng,
      lastUpdate: data.last_update
    };
  }

  async findNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
    const supabase = this.supabaseService.getClient();
    
    // Use a RPC call if PostGIS is enabled, or fetch and filter
    // For this demo, we'll fetch available drivers and filter in JS
    // In production, use PostGIS: st_distance(location, st_point(lng, lat)) < radius
    
    const { data, error } = await supabase
      .from('driver_locations')
      .select('driver_id, lat, lng')
      .eq('is_available', true)
      .gt('last_update', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 mins

    if (error || !data) return [];

    return data
      .map(d => ({
        driverId: d.driver_id,
        distance: this.calculateDistance(lat, lng, d.lat, d.lng)
      }))
      .filter(d => d.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getAllOnlineDrivers() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('is_available', true)
      .gt('last_update', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (error) return [];
    return data;
  }
}
