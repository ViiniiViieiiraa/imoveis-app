export function formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '—'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }
  
  export function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—'
    const date = typeof value === 'string' ? new Date(value) : value
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }
  
  export function formatMonth(mes: number, ano: number): string {
    const date = new Date(ano, mes - 1, 1)
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  }
  
  export function parseDateBR(value: string): Date {
    const [day, month, year] = value.split('/')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }