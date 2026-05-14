'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { getActivityTypeName, type ActivityTypeKey } from '@/lib/activity-types'

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function SettingsView() {
  const { session } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')

  const [workingHours, setWorkingHours] = useState<{ dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }[]>([])

  const token = session?.token

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!token) return

      const [businessRes, hoursRes] = await Promise.all([
        fetch('/api/business', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/working-hours', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const business = await businessRes.json()
      const hours = await hoursRes.json()

      setName(business.name || '')
      setDescription(business.description || '')
      setAddress(business.address || '')
      setCity(business.city || '')
      setProvince(business.province || '')
      setPhone(business.phone || '')
      setEmail(business.email || '')
      setWebsite(business.website || '')

      const fullWeek = Array.from({ length: 7 }, (_, i) => {
        const existing = hours.find((h: { dayOfWeek: number }) => h.dayOfWeek === i)
        return existing || { dayOfWeek: i, openTime: '09:00', closeTime: '18:00', closed: i === 0 }
      })
      setWorkingHours(fullWeek)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBusiness = async () => {
    setSavingBusiness(true)
    try {
      await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, address, city, province, phone, email, website }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      console.error('Failed to save business')
    } finally {
      setSavingBusiness(false)
    }
  }

  const handleSaveHours = async () => {
    setSavingHours(true)
    try {
      await fetch('/api/working-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hours: workingHours }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      console.error('Failed to save working hours')
    } finally {
      setSavingHours(false)
    }
  }

  const toggleDayClosed = (index: number) => {
    const updated = [...workingHours]
    updated[index] = { ...updated[index], closed: !updated[index].closed }
    setWorkingHours(updated)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestisci le informazioni della tua attivit&agrave;</p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          Modifiche salvate con successo
        </div>
      )}

      {/* Activity Type */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {session?.business?.activityType ? getActivityTypeName(session.business.activityType as ActivityTypeKey).charAt(0) : '?'}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo di attivit&agrave;</p>
              <p className="font-medium">
                {session?.business?.activityType
                  ? getActivityTypeName(session.business.activityType as ActivityTypeKey)
                  : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informazioni attivit&agrave;</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome attivit&agrave;</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>Indirizzo</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Citt&agrave;</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input value={province} onChange={(e) => setProvince(e.target.value)} className="min-h-[44px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-[44px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="min-h-[44px]" placeholder="https://" />
          </div>
          <Button
            className="gap-2 min-h-[44px]"
            disabled={savingBusiness}
            onClick={handleSaveBusiness}
          >
            {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Informazioni
          </Button>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Orari di apertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workingHours.map((wh, index) => (
            <div key={wh.dayOfWeek} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <span className="w-24 font-medium text-sm">{DAY_NAMES[wh.dayOfWeek]}</span>
              <Switch
                checked={!wh.closed}
                onCheckedChange={() => toggleDayClosed(index)}
                className="data-[state=checked]:bg-primary"
              />
              {!wh.closed ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={wh.openTime}
                    onChange={(e) => {
                      const updated = [...workingHours]
                      updated[index] = { ...updated[index], openTime: e.target.value }
                      setWorkingHours(updated)
                    }}
                    className="min-h-[40px] w-28 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">&mdash;</span>
                  <Input
                    type="time"
                    value={wh.closeTime}
                    onChange={(e) => {
                      const updated = [...workingHours]
                      updated[index] = { ...updated[index], closeTime: e.target.value }
                      setWorkingHours(updated)
                    }}
                    className="min-h-[40px] w-28 text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Chiuso</span>
              )}
            </div>
          ))}
          <Button
            className="gap-2 min-h-[44px] mt-2"
            disabled={savingHours}
            onClick={handleSaveHours}
          >
            {savingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Orari
          </Button>
        </CardContent>
      </Card>

      <div className="h-8" />
    </div>
  )
}
