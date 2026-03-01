import * as bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'taxi.db'));
const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@taxilibre.com');

if (user) {
  console.log('User found:', user.email);
  const isValid = bcrypt.compareSync('password123', user.password_hash);
  console.log('Password valid:', isValid);
} else {
  console.log('User not found');
}
