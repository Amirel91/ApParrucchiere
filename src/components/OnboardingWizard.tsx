'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { getActivityType } from '@/lib/activity-types'

const STEPS = ['Account', 'Attività', 'Orari', 'Servizi']

const DAYS = [
  { key: 'mon', label: 'Lunedì', short: 'Lun' },
  { key: 'tue', label: 'Martedì', short: 'Mar' },
  { key: 'wed', label: 'Mercoledì', short: 'Mer' },
  { key: 'thu', label: 'Giovedì', short: 'Gio' },
  { key: 'fri', label: 'Venerdì', short: 'Ven' },
  { key: 'sat', label: 'Sabato', short: 'Sab' },
]

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 }),
}

interface ServiceItem {
  name: string
  duration: number
  price: number
  buffer: number
  category: string
}

export default function OnboardingWizard() {
  const { selectedActivityType, setSession, navigate, goBack } = useAppStore()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')

  // Step 2: Activity
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')

  // Step 3: Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>({
    mon: { open: '09:00', close: '18:00' },
    tue: { open: '09:00', close: '18:00' },
    wed: { open: '09:00', close: '18:00' },
    thu: { open: '09:00', close: '18:00' },
    fri: { open: '09:00', close: '18:00' },
    sat: { open: '09:00', close: '13:00' },
  })
  const [sundayClosed, setSundayClosed] = useState(true)

  // Step 4: Services
  const [services, setServices] = useState<ServiceItem[]>([
    { name: '', duration: 30, price: 0, buffer: 0, category: '' },
  ])

  const activityType = selectedActivityType
    ? getActivityType(selectedActivityType)
    : null

  function goStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    setError('')
  }

  function updateHour(day: string, field: 'open' | 'close', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { name: '', duration: 30, price: 0, buffer: 0, category: '' },
    ])
  }

  function updateService(idx: number, field: keyof ServiceItem, value: string | number) {
    setServices((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    )
  }

  function removeService(idx: number) {
    if (services.length <= 1) return
    setServices((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    const validServices = services.filter((s) => s.name.trim().length > 0)
    if (validServices.length === 0) {
      setError('Aggiungi almeno un servizio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          businessName,
          activityType: selectedActivityType,
          description,
          address,
          city,
          province,
          hours,
          sundayClosed,
          services: validServices,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Errore nella creazione dell\'account')
      }

      const data = await res.json()
      setSession({ token: data.token, ...data })
      navigate('dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < step && goStep(i)}
                  className={`flex items-center gap-2 ${
                    i < step ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      i < step
                        ? 'bg-amber-500 text-white'
                        : i === step
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                      i <= step ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                      i < step ? 'bg-amber-400' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Crea il tuo Account</CardTitle>
                  <CardDescription>
                    Inserisci i tuoi dati personali per iniziare
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Mario Rossi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="mario@esempio.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+39 333 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Almeno 8 caratteri"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nome attività</Label>
                    <Input
                      id="businessName"
                      placeholder="La mia Attività"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Attività</CardTitle>
                  <CardDescription>
                    Descrivi la tua attività e la sua posizione
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo di attività</Label>
                    <div>
                      {activityType && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {activityType.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Input
                      id="description"
                      placeholder="Un breve descrizione della tua attività..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      placeholder="Via Roma 1"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <Input
                        id="city"
                        placeholder="Roma"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia</Label>
                      <Input
                        id="province"
                        placeholder="RM"
                        maxLength={2}
                        value={province}
                        onChange={(e) =>
                          setProvince(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Orari di Apertura</CardTitle>
                  <CardDescription>
                    Definisci gli orari per ogni giorno della settimana
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DAYS.map((day) => (
                    <div
                      key={day.key}
                      className="flex items-center gap-3 py-2"
                    >
                      <span className="w-20 sm:w-24 text-sm font-medium">
                        {day.short}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          className="w-28 sm:w-32"
                          value={hours[day.key]?.open || '09:00'}
                          onChange={(e) =>
                            updateHour(day.key, 'open', e.target.value)
                          }
                        />
                        <span className="text-muted-foreground text-sm">a</span>
                        <Input
                          type="time"
                          className="w-28 sm:w-32"
                          value={hours[day.key]?.close || '18:00'}
                          onChange={(e) =>
                            updateHour(day.key, 'close', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="sunday-closed" className="text-sm">
                        Domenica chiuso
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Attiva se non apri la domenica
                      </p>
                    </div>
                    <Switch
                      id="sunday-closed"
                      checked={sundayClosed}
                      onCheckedChange={setSundayClosed}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Primi Servizi</CardTitle>
                  <CardDescription>
                    Aggiungi i servizi che offri ai tuoi clienti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {services.map((service, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border p-3 sm:p-4 space-y-3"
                    >
                      {services.length > 1 && (
                        <button
                          onClick={() => removeService(idx)}
                          className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Rimuovi
                        </button>
                      )}
                      <div className="space-y-2">
                        <Label>Nome servizio *</Label>
                        <Input
                          placeholder="Es: Servizio Standard"
                          value={service.name}
                          onChange={(e) =>
                            updateService(idx, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Durata (min)</Label>
                          <Input
                            type="number"
                            min={5}
                            value={service.duration}
                            onChange={(e) =>
                              updateService(idx, 'duration', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Prezzo (€)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={service.price}
                            onChange={(e) =>
                              updateService(idx, 'price', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Pausa (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={service.buffer}
                            onChange={(e) =>
                              updateService(idx, 'buffer', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Categoria (opzionale)</Label>
                        <Input
                          placeholder="Es: Standard, Premium"
                          value={service.category}
                          onChange={(e) =>
                            updateService(idx, 'category', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addService}
                  >
                    + Aggiungi servizio
                  </Button>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? goBack() : goStep(step - 1))}
            className="gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? 'Indietro' : 'Precedente'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => goStep(step + 1)}
              className="gap-2 min-h-[44px]"
            >
              Avanti
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 min-h-[44px] bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Crea account
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
