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
// Uses Bearer token approach (no cookies) to avoid conflicts
// with proxy.ts cookie manipulation on the main domain.

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

/**
 * Verify superadmin token from a Bearer Authorization header.
 * Returns true if valid, false otherwise.
 */
export async function verifySuperAdminToken(token: string): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, superadminSecret)
    return true
  } catch {
    return false
  }
}

/**
 * Extract and verify superadmin token from a NextRequest.
 * Checks Authorization: Bearer <token> header.
 */
export async function requireSuperAdmin(request: Request): Promise<void> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('SuperAdminUnauthorized')
  }

  const token = authHeader.slice(7)
  const valid = await verifySuperAdminToken(token)
  if (!valid) {
    throw new Error('SuperAdminUnauthorized')
  }
}
