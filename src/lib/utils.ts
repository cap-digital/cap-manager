import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateInput(date: string): string {
  // Converte de yyyy-mm-dd para dd/mm/yyyy para exibição
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function parseDateInput(date: string): string {
  // Converte de dd/mm/yyyy para yyyy-mm-dd para o input
  if (!date) return ''
  const [day, month, year] = date.split('/')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
}

// Máscara de telefone enquanto digita
export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11)
  if (cleaned.length <= 2) {
    return cleaned
  }
  if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  }
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
}

// Máscara de CNPJ enquanto digita
export function maskCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 14)
  if (cleaned.length <= 2) {
    return cleaned
  }
  if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  }
  if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
}

// Máscara de moeda enquanto digita (R$ 10.000,00)
export function maskCurrency(value: string): string {
  // Remove tudo que não é número
  let cleaned = value.replace(/\D/g, '')

  if (!cleaned) return ''

  // Converte para número e divide por 100 para considerar centavos
  const numericValue = parseInt(cleaned, 10) / 100

  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

// Converte string formatada de moeda para número
export function parseCurrency(value: string): number {
  if (!value) return 0
  // Remove R$, espaços, pontos (separador de milhar) e substitui vírgula por ponto
  const cleaned = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  return parseFloat(cleaned) || 0
}

export function generateUTM(params: {
  url: string
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}): string {
  const url = new URL(params.url)
  url.searchParams.set('utm_source', params.source)
  url.searchParams.set('utm_medium', params.medium)
  url.searchParams.set('utm_campaign', params.campaign)
  if (params.term) url.searchParams.set('utm_term', params.term)
  if (params.content) url.searchParams.set('utm_content', params.content)
  return url.toString()
}

export function generateNomenclatura(params: {
  plataforma: string
  tipo: string
  objetivo: string
  segmentacao: string
  formato: string
  data?: Date
}): string {
  const date = params.data || new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

  return [
    params.plataforma,
    params.tipo,
    params.objetivo,
    params.segmentacao,
    params.formato,
    dateStr,
  ]
    .filter(Boolean)
    .join('_')
    .toUpperCase()
    .replace(/\s+/g, '-')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
