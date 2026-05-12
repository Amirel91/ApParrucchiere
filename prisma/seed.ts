import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.businessHours.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Mario Rossi',
      email: 'admin@barber.it',
      password: 'admin',
      phone: '+39 333 1234567',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created')

  const client1 = await prisma.user.create({
    data: {
      name: 'Luca Bianchi',
      email: 'luca@email.it',
      password: 'client',
      phone: '+39 345 9876543',
      role: 'CLIENT',
    },
  })
  console.log('✅ Client Luca created')

  const client2 = await prisma.user.create({
    data: {
      name: 'Anna Verdi',
      email: 'anna@email.it',
      password: 'client',
      phone: '+39 346 1112233',
      role: 'CLIENT',
    },
  })
  console.log('✅ Client Anna created')

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Taglio Capelli',
        description: 'Taglio classico con styling finale',
        durationMinutes: 30,
        price: 18.00,
        bufferMinutes: 10,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Barba',
        description: 'Rasatura tradizionale con panno caldo',
        durationMinutes: 20,
        price: 12.00,
        bufferMinutes: 10,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Taglio + Barba',
        description: 'Taglio completo con rasatura barba',
        durationMinutes: 45,
        price: 25.00,
        bufferMinutes: 10,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Shampoo + Taglio',
        description: 'Lavaggio con shampoo professionale e taglio',
        durationMinutes: 40,
        price: 22.00,
        bufferMinutes: 10,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Colore',
        description: 'Colorazione completa con prodotti professionali',
        durationMinutes: 60,
        price: 35.00,
        bufferMinutes: 15,
      },
    }),
  ])
  console.log('✅ 5 services created')

  // Create business hours
  const businessHours = [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', closed: false }, // Monday
    { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', closed: false }, // Tuesday
    { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', closed: false }, // Wednesday
    { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', closed: false }, // Thursday
    { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', closed: false }, // Friday
    { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', closed: false }, // Saturday
    { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', closed: true },  // Sunday
  ]

  await Promise.all(
    businessHours.map((bh) =>
      prisma.businessHours.create({ data: bh })
    )
  )
  console.log('✅ Business hours created')

  // Create some sample appointments
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  dayAfterTomorrow.setHours(14, 0, 0, 0)

  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      serviceId: services[0].id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      status: 'CONFIRMED',
      clientName: client1.name,
      clientPhone: client1.phone,
      clientEmail: client1.email,
    },
  })

  await prisma.appointment.create({
    data: {
      clientId: client2.id,
      serviceId: services[2].id,
      startTime: dayAfterTomorrow,
      endTime: new Date(dayAfterTomorrow.getTime() + 45 * 60 * 1000),
      status: 'CONFIRMED',
      clientName: client2.name,
      clientPhone: client2.phone,
      clientEmail: client2.email,
    },
  })
  console.log('✅ Sample appointments created')

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
