import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';

@Injectable()
export class AdminService {
  constructor(private databaseService: DatabaseService) {}

  async getStats() {
    const totalRides = this.databaseService.get('SELECT COUNT(*) as count FROM rides') as any;
    const totalRevenue = this.databaseService.get('SELECT SUM(price_total) as sum FROM rides WHERE status = "COMPLETED"') as any;
    const totalDrivers = this.databaseService.get('SELECT COUNT(*) as count FROM drivers WHERE status = "VERIFIED"') as any;
    const pendingDrivers = this.databaseService.get('SELECT COUNT(*) as count FROM drivers WHERE status = "PENDING_REVIEW"') as any;

    // Monthly data for charts
    const monthlyRides = this.databaseService.query(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM rides
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `);

    return {
      totalRides: totalRides.count,
      totalRevenue: totalRevenue.sum || 0,
      totalDrivers: totalDrivers.count,
      pendingDrivers: pendingDrivers.count,
      monthlyRides: monthlyRides.reverse(),
    };
  }

  async getPendingDrivers() {
    return this.databaseService.query(`
      SELECT u.id as userId, u.name, u.email, u.phone, d.id as driverId, d.status, d.licence_number, v.brand, v.model, v.plate_number, v.type
      FROM users u
      JOIN drivers d ON u.id = d.user_id
      LEFT JOIN vehicles v ON d.id = v.driver_id
      WHERE d.status = 'PENDING_REVIEW'
    `);
  }

  async verifyDriver(driverId: number, status: string) {
    const isVerified = status === 'VERIFIED' ? 1 : 0;
    this.databaseService.run(
      'UPDATE drivers SET status = ?, is_verified = ? WHERE id = ?',
      [status, isVerified, driverId]
    );
    return { success: true };
  }

  async getUsers(role?: string) {
    let sql = 'SELECT id, name, email, role, status, created_at FROM users';
    const params = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    return this.databaseService.query(sql, params);
  }

  async getRides() {
    return this.databaseService.query(`
      SELECT r.*, p.name as passengerName, d_u.name as driverName
      FROM rides r
      JOIN users p ON r.passenger_id = p.id
      LEFT JOIN users d_u ON r.driver_id = d_u.id
      ORDER BY r.created_at DESC
    `);
  }
}
