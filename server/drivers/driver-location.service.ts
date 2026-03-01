import { Injectable } from '@nestjs/common';

export interface Location {
  lat: number;
  lng: number;
  lastUpdate: string;
  isAvailable: boolean;
}

@Injectable()
export class DriverLocationService {
  private locations = new Map<number, Location>();

  async updateLocation(userId: number, lat: number, lng: number, isAvailable: boolean = true) {
    const location: Location = {
      lat,
      lng,
      lastUpdate: new Date().toISOString(),
      isAvailable
    };
    this.locations.set(userId, location);
    return location;
  }

  async getLocation(userId: number): Promise<Location | null> {
    return this.locations.get(userId) || null;
  }

  async findNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
    const nearby: { driverId: number; distance: number; lat: number; lng: number }[] = [];
    
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    this.locations.forEach((loc, driverId) => {
      const lastUpdate = new Date(loc.lastUpdate).getTime();
      if (loc.isAvailable && lastUpdate > fiveMinutesAgo) {
        const distance = this.calculateDistance(lat, lng, loc.lat, loc.lng);
        if (distance <= radiusKm) {
          nearby.push({ driverId, distance, lat: loc.lat, lng: loc.lng });
        }
      }
    });

    return nearby.sort((a, b) => a.distance - b.distance);
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
    const online: any[] = [];
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    this.locations.forEach((loc, driverId) => {
      const lastUpdate = new Date(loc.lastUpdate).getTime();
      if (loc.isAvailable && lastUpdate > tenMinutesAgo) {
        online.push({ driverId, ...loc });
      }
    });
    return online;
  }
}
