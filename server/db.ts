import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('taxilibre.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT CHECK(role IN ('passenger', 'driver', 'admin')) NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drivers (
    user_id INTEGER PRIMARY KEY,
    license_number TEXT UNIQUE NOT NULL,
    driver_type TEXT CHECK(driver_type IN ('taxi', 'vtc')) NOT NULL,
    professional_card_url TEXT,
    insurance_url TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_status TEXT CHECK(verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rating REAL DEFAULT 5.0,
    is_available INTEGER DEFAULT 0,
    current_lat REAL,
    current_lng REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('standard', 'premium', 'xl')) NOT NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id)
  );

  CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL,
    driver_id INTEGER,
    pickup_address TEXT NOT NULL,
    pickup_lat REAL NOT NULL,
    pickup_lng REAL NOT NULL,
    destination_address TEXT NOT NULL,
    destination_lat REAL NOT NULL,
    destination_lng REAL NOT NULL,
    status TEXT CHECK(status IN ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'requested',
    price REAL,
    distance REAL,
    duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ride_id INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id)
  );
`);

export default db;
