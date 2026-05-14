import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET environment variable is not set');
const JWT_SECRET = new TextEncoder().encode(secret);

export async function signToken(payload: { id: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
