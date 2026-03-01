import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database.Database;

  onModuleInit() {
    this.db = new Database(join(process.cwd(), 'taxi.db'));
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT CHECK(role IN ('PASSENGER', 'DRIVER', 'ADMIN')) NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        status TEXT CHECK(status IN ('ACTIVE', 'SUSPENDED', 'DELETED')) DEFAULT 'ACTIVE',
        language TEXT DEFAULT 'fr',
        country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        driver_type TEXT CHECK(driver_type IN ('TAXI', 'VTC')) DEFAULT 'VTC',
        licence_number TEXT,
        taxi_license_number TEXT,
        vtc_license_number TEXT,
        status TEXT CHECK(status IN ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED')) DEFAULT 'PENDING_REVIEW',
        rating REAL DEFAULT 5.0,
        is_verified INTEGER DEFAULT 0,
        total_rides INTEGER DEFAULT 0,
        total_earnings REAL DEFAULT 0,
        is_available INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER UNIQUE NOT NULL,
        brand TEXT,
        model TEXT,
        plate_number TEXT,
        type TEXT CHECK(type IN ('STANDARD', 'PREMIUM', 'XL')) NOT NULL,
        color TEXT,
        FOREIGN KEY(driver_id) REFERENCES drivers(id)
      );

      CREATE TABLE IF NOT EXISTS rides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        passenger_id INTEGER NOT NULL,
        driver_id INTEGER,
        service_type TEXT CHECK(service_type IN ('TAXI', 'VTC')) DEFAULT 'VTC',
        pickup_address TEXT NOT NULL,
        pickup_lat REAL NOT NULL,
        pickup_lng REAL NOT NULL,
        dropoff_address TEXT NOT NULL,
        dropoff_lat REAL NOT NULL,
        dropoff_lng REAL NOT NULL,
        distance_km REAL,
        duration_min REAL,
        price_total REAL,
        platform_fee REAL,
        driver_earnings REAL,
        status TEXT CHECK(status IN ('REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')) DEFAULT 'REQUESTED',
        payment_status TEXT CHECK(payment_status IN ('PENDING', 'PAID', 'REFUNDED')) DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(passenger_id) REFERENCES users(id),
        FOREIGN KEY(driver_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ride_id INTEGER NOT NULL,
        method TEXT CHECK(method IN ('CARD', 'CASH', 'WALLET')) NOT NULL,
        stripe_payment_intent_id TEXT,
        stripe_customer_id TEXT,
        amount REAL NOT NULL,
        commission REAL NOT NULL,
        driver_payout REAL NOT NULL,
        status TEXT CHECK(status IN ('PENDING', 'REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'PENDING_CASH')) DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ride_id) REFERENCES rides(id)
      );

      CREATE TABLE IF NOT EXISTS driver_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('LICENSE', 'PRO_CARD', 'INSURANCE', 'REGISTRATION')) NOT NULL,
        file_url TEXT NOT NULL,
        status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(driver_id) REFERENCES drivers(id)
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ride_id INTEGER NOT NULL,
        passenger_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ride_id) REFERENCES rides(id),
        FOREIGN KEY(passenger_id) REFERENCES users(id),
        FOREIGN KEY(driver_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ride_id INTEGER,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(ride_id) REFERENCES rides(id)
      );
    `);
    
    // Seed Admin if not exists
    const admin = this.db.prepare('SELECT * FROM users WHERE role = ?').get('ADMIN');
    if (!admin) {
      const passwordHash = bcrypt.hashSync('password123', 10);
      this.db.prepare(`
        INSERT INTO users (role, name, email, password_hash)
        VALUES (?, ?, ?, ?)
      `).run('ADMIN', 'Super Admin', 'admin@taxilibre.com', passwordHash);
    }
  }

  query(sql: string, params: any[] = []) {
    return this.db.prepare(sql).all(params);
  }

  get(sql: string, params: any[] = []) {
    return this.db.prepare(sql).get(params);
  }

  run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(params);
  }
}
