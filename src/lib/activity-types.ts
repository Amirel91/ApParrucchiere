import {
  Scissors,
  Sparkles,
  Hand,
  Waves,
  HeartPulse,
  Dumbbell,
  Activity,
  Hospital,
  Palette,
  Dog,
  Sun,
  type LucideIcon,
} from 'lucide-react'

export interface ActivityType {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
}

export const ACTIVITY_TYPES: ActivityType[] = [
  {
    id: 'SALONE',
    name: 'Salone',
    description: 'Taglio, piega, colore e trattamenti per capelli',
    icon: Scissors,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'BARBIERE',
    name: 'Barbiere',
    description: 'Taglio, barba e rasatura tradizionale',
    icon: Scissors,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'UNGHIE',
    name: 'Unghie',
    description: 'Manicure, pedicure, smalto semipermanente',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'SPA_SAUNA',
    name: 'Spa e Sauna',
    description: 'Relax, trattamenti benessere e saune',
    icon: Waves,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'MEDSPA',
    name: 'MedSpa',
    description: 'Estetica avanzata e medicina estetica',
    icon: HeartPulse,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'MASSAGGI',
    name: 'Massaggi',
    description: 'Massaggio rilassante, sportivo, decontratturante',
    icon: Hand,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'FITNESS_RECUPERO',
    name: 'Fitness e Recupero',
    description: 'Allenamento personalizzato e riabilitazione',
    icon: Dumbbell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'FISIOTERAPIA',
    name: 'Fisioterapia',
    description: 'Riabilitazione, terapia fisica e strumentale',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'CENTRI_SANITARI',
    name: 'Centri Sanitari',
    description: 'Centri medici, ambulatori e cliniche',
    icon: Hospital,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'TATUAGGI_PIERCING',
    name: 'Tatuaggi e Piercing',
    description: 'Tatuaggi artistici, piercing e body art',
    icon: Palette,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'TOELETTATURA_ANIMALI',
    name: 'Toelettatura Animali',
    description: 'Toelettatura, lavaggio e cura per animali',
    icon: Dog,
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
  },
  {
    id: 'CENTRO_ABBRONZANTE',
    name: 'Centro Abbronzante',
    description: 'Lampade abbronzanti e trattamenti solarium',
    icon: Sun,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
]

export type ActivityTypeKey = (typeof ACTIVITY_TYPES)[number]['id']

export function getActivityType(id: string): ActivityType | undefined {
  return ACTIVITY_TYPES.find((a) => a.id === id)
}

export function getActivityTypeName(id: string): string {
  return getActivityType(id)?.name || id
}

export function getActivityTypeColor(id: string): string {
  return getActivityType(id)?.color || 'text-gray-600'
}

export function getActivityTypeBg(id: string): string {
  return getActivityType(id)?.bgColor || 'bg-gray-50'
}
