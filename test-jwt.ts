import jwt from 'jsonwebtoken';

const payload = { sub: 1, email: 'admin@taxilibre.com', role: 'ADMIN' };
const secret = 'super-secret-key';

try {
  const token = jwt.sign(payload, secret, { expiresIn: '1d' });
  console.log('Token generated:', token);
  const decoded = jwt.verify(token, secret);
  console.log('Decoded:', decoded);
} catch (err: any) {
  console.error('JWT Error:', err.message);
}
