import {
  Sparkles,
  Scissors,
  Waves,
  HeartPulse,
  Dumbbell,
  Stethoscope,
  GraduationCap,
  Car,
  Dog,
  Scale,
  Wrench,
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
    id: 'ESTETICA_BEAUTY',
    name: 'Estetica & Beauty',
    description: 'Trattamenti estetici, manicure, pulizia viso e cura del corpo',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'SALONI_CAPELLI',
    name: 'Saloni & Capelli',
    description: 'Taglio, piega, colore e trattamenti per capelli',
    icon: Scissors,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'BENESSERE_SPA',
    name: 'Benessere, Massaggi & SPA',
    description: 'Massaggi, percorsi benessere, trattamenti corpo e relax',
    icon: Waves,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'TATUAGGI_PIERCING',
    name: 'Tatuaggi & Piercing',
    description: 'Tatuaggi artistici, piercing e body art',
    icon: HeartPulse,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'AUTO_MOTO',
    name: 'Auto, Moto & Gommisti',
    description: 'Officine, gommisti, elettrauto e lavaggi',
    icon: Car,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'FISIOTERAPIA_MEDICA',
    name: 'Fisioterapia, Osteopatia & Studi Medici',
    description: 'Fisioterapia, osteopatia, visite specialistiche e riabilitazione',
    icon: Stethoscope,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'PERSONAL_TRAINER_SPORT',
    name: 'Personal Trainer, Palestre & Sport',
    description: 'Personal training, lezioni sportive e preparazione atletica',
    icon: Dumbbell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'STUDI_LEALI_CONSULENZA',
    name: 'Studi Legali, Commercialisti & Consulenza',
    description: 'Consulenze legali, fiscali, amministrative e strategiche',
    icon: Scale,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'PET_GROOMING',
    name: 'Pet Grooming & Servizi Animali',
    description: 'Toelettatura, lavaggio, taglio e cura per animali',
    icon: Dog,
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
  },
  {
    id: 'SCUOLE_CORSI',
    name: 'Scuole, Corsi & Lezioni Private',
    description: 'Lezioni private, ripetizioni, corsi e formazione',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'ALTRO',
    name: 'Altro',
    description: 'Altre tipologie di attività e servizi',
    icon: Wrench,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
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
