import fp from 'fastify-plugin'
import view from '@fastify/view'
import Handlebars from 'handlebars'
import path from 'path'
import { formatCurrency, formatDate } from '../shared/formatters'

export default fp(async (fastify) => {
  Handlebars.registerHelper('currency', (val: unknown) => formatCurrency(val as number))
  Handlebars.registerHelper('date', (val: unknown) => formatDate(val as Date))

  Handlebars.registerHelper('dateInput', (val: unknown) => {
    if (!val) return ''
    const d = typeof val === 'string' ? new Date(val) : (val as Date)
    return d.toISOString().split('T')[0]
  })

  Handlebars.registerHelper('number', (val: unknown) => {
    if (val == null) return '—'
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
  Handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b)
  Handlebars.registerHelper('or', (a: unknown, b: unknown) => a || b)
  Handlebars.registerHelper('and', (a: unknown, b: unknown) => a && b)
  Handlebars.registerHelper('not', (a: unknown) => !a)
  Handlebars.registerHelper('json', (ctx: unknown) => JSON.stringify(ctx))

  Handlebars.registerHelper('mes', (m: number, a: number) => {
    const d = new Date(a, m - 1, 1)
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })

  Handlebars.registerHelper('statusLabel', (status: string) => {
    const map: Record<string, string> = {
      vaga: 'Vaga', ocupada: 'Ocupada', indisponivel: 'Indisponível',
      ativo: 'Ativo', encerrado: 'Encerrado', suspenso: 'Suspenso',
      pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', isento: 'Isento', parcial: 'Parcial',
      residencial: 'Residencial', comercial: 'Comercial', misto: 'Misto',
      fisica: 'Pessoa Física', juridica: 'Pessoa Jurídica',
      avulsa: 'Avulsa', recorrente: 'Recorrente',
    }
    return map[status] ?? status
  })

  Handlebars.registerHelper('statusClass', (status: string) => {
    const map: Record<string, string> = {
      vaga: 'badge-warning', ocupada: 'badge-success', indisponivel: 'badge-neutral',
      ativo: 'badge-success', encerrado: 'badge-neutral', suspenso: 'badge-warning',
      pendente: 'badge-warning', pago: 'badge-success', atrasado: 'badge-danger', isento: 'badge-neutral', parcial: 'badge-info',
    }
    return map[status] ?? 'badge-neutral'
  })

  await fastify.register(view, {
    engine: { handlebars: Handlebars },
    root: path.join(process.cwd(), 'views'),
    layout: 'layouts/main',
    viewExt: 'hbs',
  })
})
