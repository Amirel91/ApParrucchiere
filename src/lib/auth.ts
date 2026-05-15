import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
)

const COOKIE_NAME = 'admin_token'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { username: string; id: string; tenantId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { username: string; id: string; tenantId: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session as { username: string; id: string; tenantId: string }
}

// ============ SUPERADMIN AUTH ============
// Separate cookie and JWT for platform owner access.
// Password is set via SUPERADMIN_PASSWORD env var.

const SUPERADMIN_COOKIE = 'superadmin_token'
const superadminSecret = new TextEncoder().encode(
  process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me'
)

export async function createSuperAdminToken(): Promise<string> {
  return new SignJWT({ role: 'superadmin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(superadminSecret)
}

export async function getSuperAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SUPERADMIN_COOKIE)?.value
  if (!token) return false
  try {
    await jwtVerify(token, superadminSecret)
    return true
  } catch {
    return false
  }
}

export async function requireSuperAdmin(): Promise<void> {
  const valid = await getSuperAdminSession()
  if (!valid) {
    throw new Error('SuperAdminUnauthorized')
  }
}
