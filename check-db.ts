import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'taxi.db'));
const users = db.prepare('SELECT id, email, role FROM users').all();
console.log('Users:', users);
