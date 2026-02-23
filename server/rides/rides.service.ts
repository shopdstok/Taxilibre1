import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { DriverLocationService } from '../drivers/driver-location.service';

@Injectable()
export class RidesService {
  constructor(
    private databaseService: DatabaseService,
    private driverLocationService: DriverLocationService
  ) {}

  async createRide(passengerId: number, data: any) {
    const { pickup, destination, price, distance, duration } = data;
    
    const result = this.databaseService.run(`
      INSERT INTO rides (passenger_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, price_total, distance_km, duration_min)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      passengerId, 
      pickup.address, pickup.lat, pickup.lng, 
      destination.address, destination.lat, destination.lng, 
      price, distance, duration
    ]);

    return { id: result.lastInsertRowid, status: 'REQUESTED' };
  }

  async updateStatus(rideId: number, status: string, driverId?: number) {
    if (status === 'DRIVER_ASSIGNED' && driverId) {
      this.databaseService.run(
        'UPDATE rides SET status = ?, driver_id = ? WHERE id = ?',
        [status, driverId, rideId]
      );
      this.databaseService.run(
        'UPDATE drivers SET is_available = 0 WHERE user_id = ?',
        [driverId]
      );
    } else {
      this.databaseService.run(
        'UPDATE rides SET status = ? WHERE id = ?',
        [status, rideId]
      );
    }

    if (status === 'COMPLETED') {
      const ride = this.databaseService.get('SELECT driver_id FROM rides WHERE id = ?', [rideId]) as any;
      if (ride && ride.driver_id) {
        this.databaseService.run('UPDATE drivers SET is_available = 1 WHERE user_id = ?', [ride.driver_id]);
      }
    }

    return { success: true };
  }

  async getRide(id: number) {
    return this.databaseService.get(`
      SELECT r.*, p.name as passengerName, d_u.name as driverName, v.brand, v.model, v.plate_number
      FROM rides r
      JOIN users p ON r.passenger_id = p.id
      LEFT JOIN users d_u ON r.driver_id = d_u.id
      LEFT JOIN vehicles v ON d_u.id = v.driver_id
      WHERE r.id = ?
    `, [id]);
  }

  async findNearbyDrivers(lat: number, lng: number) {
    // 1. Get nearby driver IDs from real-time location service (Redis/Memory)
    const nearbyLocations = await this.driverLocationService.findNearbyDrivers(lat, lng, 5); // 5km radius
    
    if (nearbyLocations.length === 0) return [];

    const driverIds = nearbyLocations.map(l => l.driverId);
    
    // 2. Enrich with driver details from DB
    const placeholders = driverIds.map(() => '?').join(',');
    const drivers = this.databaseService.query(`
      SELECT u.id, u.name, d.rating, d.user_id
      FROM users u
      JOIN drivers d ON u.id = d.user_id
      WHERE u.id IN (${placeholders}) AND d.status = 'VERIFIED' AND d.is_available = 1
    `, driverIds);

    // 3. Merge and sort by distance
    return drivers.map((d: any) => {
      const loc = nearbyLocations.find(l => l.driverId === d.id);
      return {
        ...d,
        distance: loc ? loc.distance : null
      };
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }
}
