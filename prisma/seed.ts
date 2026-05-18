import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      businessName: 'Studio Professionale',
      ownerName: '',
      ownerEmail: '',
    },
  })
  console.log(`✅ Tenant created: ${tenant.slug}`)

  // Create admin user linked to tenant
  const hashedPw = await hashPassword('admin123')
  const admin = await prisma.adminUser.upsert({
    where: {
      tenantId_username: { tenantId: tenant.id, username: 'admin' },
    },
    update: {},
    create: {
      username: 'admin',
      password: hashedPw,
      tenantId: tenant.id,
    },
  })
  console.log(`✅ Admin user created: ${admin.username}`)

  // Create business config linked to tenant
  const config = await prisma.businessConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      tenantId: tenant.id,
      shopName: 'Studio Professionale',
      shopDescription: 'Il tuo studio di fiducia. Prenota il tuo appuntamento in pochi clic.',
      shopPhone: '+39 02 1234567',
      shopEmail: 'info@studioprofessionale.it',
      shopAddress: 'Via Roma 42, Milano',
    },
  })
  console.log(`✅ Business config created: ${config.shopName}`)

  // Create default working hours (Mon-Sat 09:00-18:00, Sun closed)
  const defaultHours = [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', closed: false }, // Mon
    { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', closed: false }, // Tue
    { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', closed: false }, // Wed
    { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', closed: false }, // Thu
    { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', closed: false }, // Fri
    { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', closed: false }, // Sat
    { dayOfWeek: 7, openTime: '09:00', closeTime: '18:00', closed: true },  // Sun
  ]

  for (const wh of defaultHours) {
    await prisma.workingHours.upsert({
      where: {
        configId_dayOfWeek: { configId: config.id, dayOfWeek: wh.dayOfWeek },
      },
      update: {},
      create: { ...wh, configId: config.id },
    })
  }
  console.log('✅ Working hours created')

  // Create sample services
  const services = [
    { name: 'Consulenza', description: 'Consulenza professionale personalizzata', price: 35, durationMinutes: 45, active: true, sortOrder: 1 },
    { name: 'Primo Appuntamento', description: 'Valutazione iniziale e analisi', price: 20, durationMinutes: 30, active: true, sortOrder: 2 },
    { name: 'Trattamento Base', description: 'Trattamento standard della durata di 40 minuti', price: 25, durationMinutes: 40, active: true, sortOrder: 3 },
    { name: 'Trattamento Avanzato', description: 'Trattamento completo e approfondito', price: 50, durationMinutes: 60, active: true, sortOrder: 4 },
    { name: 'Pacchetto Premium', description: 'Servizio completo con analisi dettagliata', price: 65, durationMinutes: 90, active: true, sortOrder: 5 },
    { name: 'Sessione Intensiva', description: 'Sessione prolungata per casi complessi', price: 80, durationMinutes: 120, active: true, sortOrder: 6 },
    { name: 'Controllo Periodico', description: 'Verifica periodica di follow-up', price: 18, durationMinutes: 30, active: true, sortOrder: 7 },
    { name: 'Visita di Follow-up', description: 'Controllo successivo al trattamento', price: 30, durationMinutes: 45, active: true, sortOrder: 8 },
  ]

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: `service-${s.sortOrder}` },
      update: {},
      create: { ...s, id: `service-${s.sortOrder}`, configId: config.id },
    })
  }
  console.log(`✅ ${services.length} services created`)

  console.log('🎉 Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
