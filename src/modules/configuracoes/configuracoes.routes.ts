import { FastifyInstance } from 'fastify'
import { getTemplateCobranca, setConfig, TEMPLATE_PADRAO } from './configuracoes.service'

export default async function configuracoesRoutes(fastify: FastifyInstance) {
  fastify.get('/configuracoes', async (request, reply) => {
    const q = request.query as Record<string, string>
    const template = await getTemplateCobranca()
    return reply.view('configuracoes/index', {
      title: 'Configurações', activePage: '/configuracoes',
      template, templatePadrao: TEMPLATE_PADRAO,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.post('/configuracoes', async (request, reply) => {
    const body = request.body as Record<string, string>
    await setConfig('template_cobranca', body.template_cobranca ?? TEMPLATE_PADRAO)
    return reply.redirect('/configuracoes?flash=success&msg=Configurações+salvas+com+sucesso')
  })
}
