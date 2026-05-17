import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { z } from 'zod'

const globalLoginSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  password: z.string().min(6),
})

/**
 * POST /api/auth/global-login
 *
 * Authenticates a tenant admin from the main domain (intelligenda.it/login).
 * Unlike /api/auth/login which reads tenant from cookie, this endpoint
 * accepts the slug explicitly in the request body.
 *
 * On success, returns the slug and business info so the frontend
 * can redirect to /account?slug=xxx.
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    const body = await request.json()
    const data = globalLoginSchema.parse(body)

    // Find tenant by slug
    const tenant = await db.tenant.findUnique({
      where: { slug: data.slug },
      select: {
        id: true,
        slug: true,
        businessName: true,
        active: true,
        subscriptionStatus: true,
        config: { select: { id: true } },
        admins: { select: { id: true, username: true } },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Nessuna attivita trovata con questo indirizzo' },
        { status: 404 }
      )
    }

    if (!tenant.active) {
      return NextResponse.json(
        { error: 'Questa attivita e stata sospesa' },
        { status: 403 }
      )
    }

    if (!tenant.config) {
      return NextResponse.json(
        { error: 'Configurazione non trovata' },
        { status: 404 }
      )
    }

    // Find admin user — username defaults to slug during registration
    const user = await db.adminUser.findFirst({
      where: {
        tenantId: tenant.id,
        username: data.slug,
      },
      select: { id: true, username: true, password: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(data.password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Success — return tenant info for redirect to /account
    return NextResponse.json({
      success: true,
      slug: tenant.slug,
      businessName: tenant.businessName,
      subscriptionStatus: tenant.subscriptionStatus,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
    }
    console.error('POST /api/auth/global-login error:', error)
    return NextResponse.json({ error: 'Errore di login' }, { status: 500 })
  }
}
