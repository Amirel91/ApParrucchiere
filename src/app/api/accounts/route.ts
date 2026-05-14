import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      password,
      businessName,
      activityType,
      address,
      city,
      province,
      description,
      workingHours,
    } = body

    if (!name || !email || !password || !businessName || !activityType) {
      return NextResponse.json(
        { error: 'Nome, email, password, nome attività e tipo attività sono obbligatori' },
        { status: 400 }
      )
    }

    const existing = await db.account.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Un account con questa email esiste già' },
        { status: 409 }
      )
    }

    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const account = await db.account.create({
      data: {
        name,
        email,
        phone: phone || null,
        password,
        business: {
          create: {
            name: businessName,
            slug,
            activityType,
            address: address || null,
            city: city || null,
            province: province || null,
            description: description || null,
            workingHours: {
              createMany: {
                data: (workingHours || []).map((wh: { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }) => ({
                  dayOfWeek: wh.dayOfWeek,
                  openTime: wh.openTime,
                  closeTime: wh.closeTime,
                  closed: wh.closed ?? false,
                })),
              },
            },
          },
        },
      },
      include: { business: true },
    })

    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db.session.create({
      data: {
        token,
        accountId: account.id,
        expiresAt,
      },
    })

    return NextResponse.json({
      session: {
        token,
        account: {
          id: account.id,
          email: account.email,
          name: account.name,
          phone: account.phone,
        },
        business: account.business,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Errore nella registrazione:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Errore durante la registrazione', details: msg },
      { status: 500 }
    )
  }
}
