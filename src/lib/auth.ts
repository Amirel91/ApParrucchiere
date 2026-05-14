import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export interface AuthSession {
  id: string
  accountId: string
  account: {
    id: string
    email: string
    name: string
  }
  business: {
    id: string
    name: string
    slug: string
    activityType: string
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    const token = authHeader.slice(7)
    if (!token) return null

    const session = await db.session.findUnique({
      where: { token },
      include: {
        account: {
          include: { business: true },
        },
      },
    })

    if (!session || session.expiresAt < new Date()) return null

    return {
      id: session.id,
      accountId: session.accountId,
      account: {
        id: session.account.id,
        email: session.account.email,
        name: session.account.name,
      },
      business: session.account.business
        ? {
            id: session.account.business.id,
            name: session.account.business.name,
            slug: session.account.business.slug,
            activityType: session.account.business.activityType,
          }
        : null as unknown as AuthSession['business'],
    }
  } catch {
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  const session = await getSessionFromRequest(request)
  if (!session) {
    throw new Error('Non autenticato')
  }
  return session
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(48)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

export function getAuthTokenFromCookies(): string | null {
  // For middleware usage
  const cookieStore = headers()
  // Not used in API routes, they use Authorization header
  return null
}
