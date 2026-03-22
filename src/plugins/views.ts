import fp from 'fastify-plugin'
import view from '@fastify/view'
import Handlebars from 'handlebars'
import path from 'path'
import { formatCurrency, formatDate, formatMonth } from '../shared/formatters'

export default fp(async (fastify) => {
  Handlebars.registerHelper('currency', formatCurrency)
  Handlebars.registerHelper('date', formatDate)
  Handlebars.registerHelper('month', formatMonth)

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
  Handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b)

  Handlebars.registerHelper('statusLabel', (status: string) => {
    const labels: Record<string, string> = {
      vaga: 'Vaga',
      ocupada: 'Ocupada',
      indisponivel: 'Indisponível',
      ativo: 'Ativo',
      encerrado: 'Encerrado',
      suspenso: 'Suspenso',
      pendente: 'Pendente',
      pago: 'Pago',
      atrasado: 'Atrasado',
      isento: 'Isento',
    }
    return labels[status] ?? status
  })

  Handlebars.registerHelper('statusClass', (status: string) => {
    const classes: Record<string, string> = {
      vaga: 'badge-warning',
      ocupada: 'badge-success',
      indisponivel: 'badge-neutral',
      ativo: 'badge-success',
      encerrado: 'badge-neutral',
      suspenso: 'badge-warning',
      pendente: 'badge-warning',
      pago: 'badge-success',
      atrasado: 'badge-danger',
      isento: 'badge-neutral',
    }
    return classes[status] ?? 'badge-neutral'
  })

  await fastify.register(view, {
    engine: { handlebars: Handlebars },
    root: path.join(process.cwd(), 'views'),
    layout: 'layouts/main',
    options: { partials: {} },
    viewExt: 'hbs',
  })
})