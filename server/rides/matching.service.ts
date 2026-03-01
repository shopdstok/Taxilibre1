import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { DriverLocationService } from '../drivers/driver-location.service';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(DriverLocationService) private driverLocationService: DriverLocationService,
  ) {}

  async findDriverForRide(rideId: number) {
    const ride: any = this.databaseService.get('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!ride) return null;

    // 1. Find nearby available drivers
    const nearbyDrivers = await this.driverLocationService.findNearbyDrivers(
      ride.pickup_lat,
      ride.pickup_lng,
      10 // 10km radius
    );

    if (nearbyDrivers.length === 0) {
      console.log(`No drivers found for ride ${rideId}`);
      return null;
    }

    // 2. Cascade matching logic
    for (const nearby of nearbyDrivers) {
      // In a real app, we would send a notification to the driver and wait for acceptance
      // For this demo, we'll automatically assign the first available driver
      
      const driver: any = this.databaseService.get(
        'SELECT u.id, u.name FROM users u JOIN drivers d ON u.id = d.user_id WHERE u.id = ? AND d.is_verified = 1 AND d.driver_type = ?',
        [nearby.driverId, ride.service_type]
      );

      if (driver) {
        // Assign driver to ride
        this.databaseService.run(
          'UPDATE rides SET driver_id = ?, status = "accepted" WHERE id = ?',
          [driver.id, rideId]
        );

        // Mark driver as unavailable
        await this.driverLocationService.updateLocation(driver.id, nearby.lat, nearby.lng, false);

        console.log(`Assigned driver ${driver.id} to ride ${rideId}`);
        return driver;
      }
    }

    return null;
  }
}
