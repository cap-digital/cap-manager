import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

// Função para calcular todos os valores da estratégia
interface CalculoInput {
  valorBruto: number
  porcentagemAgencia: number
  porcentagemPlataforma: number
  entregaContratada: number | null
  gastoAteMomento: number | null
  entregueAteMomento: number | null
  kpi: string | null
  dataInicio: Date | null
  tipoCobranca: string
  dataFimProjeto: Date | null
}

function calcularValoresEstrategia(input: CalculoInput) {
  const isFee = input.tipoCobranca === 'fee'
  const valorBruto = input.valorBruto || 0
  const porcentagemAgencia = isFee ? 0 : (input.porcentagemAgencia || 0)
  const porcentagemPlataforma = isFee ? 100 : (input.porcentagemPlataforma || 0)
  const entregaContratada = input.entregaContratada || 0
  const gastoAteMomento = input.gastoAteMomento || 0
  const entregueAteMomento = input.entregueAteMomento || 0

  // Valor Líquido: TD = Bruto - (Bruto * %Agência), FEE = Bruto
  const valorLiquido = isFee ? valorBruto : valorBruto - (valorBruto * porcentagemAgencia / 100)

  // Valor Plataforma: TD = Líquido * %Plataforma, FEE = Bruto
  const valorPlataforma = isFee ? valorBruto : valorLiquido * (porcentagemPlataforma / 100)

  // Coeficiente: Valor Plataforma / Valor Bruto (TD apenas)
  const coeficiente = !isFee && valorBruto > 0 ? valorPlataforma / valorBruto : null

  // Dias da estratégia: data_fim projeto - data_inicio estratégia
  let diasEstrategia: number | null = null
  if (input.dataFimProjeto && input.dataInicio) {
    const fim = new Date(input.dataFimProjeto)
    const inicio = new Date(input.dataInicio)
    diasEstrategia = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    if (diasEstrategia < 0) diasEstrategia = null
  }

  // Dias até acabar
  let diasAteAcabar: number | null = null
  if (input.dataFimProjeto) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(input.dataFimProjeto)
    diasAteAcabar = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    if (diasAteAcabar < 0) diasAteAcabar = 0
  }

  // Valor por Dia Plataforma
  const valorPorDiaPlataforma = diasEstrategia && diasEstrategia > 0 ? valorPlataforma / diasEstrategia : null

  // % Entrega Contratada
  const percentualEntrega = entregaContratada > 0 && entregueAteMomento > 0
    ? (entregueAteMomento / entregaContratada) * 100
    : null

  // Custo por Resultado: Gasto até o momento / Entregue até o momento
  const custoResultado = entregueAteMomento > 0 && gastoAteMomento > 0
    ? gastoAteMomento / entregueAteMomento
    : null

  // Estimativa de Resultado: Valor Plataforma / (Gasto até o momento / Entregue até o momento)
  const estimativaResultado = custoResultado && custoResultado > 0
    ? valorPlataforma / custoResultado
    : null

  // Estimativa de Sucesso: Estimativa de Resultado / Entrega Contratada (em %)
  const estimativaSucesso = estimativaResultado && entregaContratada > 0
    ? (estimativaResultado / entregaContratada) * 100
    : null

  // Valor Restante: Valor Plataforma - Gasto até o momento
  const valorRestante = valorPlataforma - gastoAteMomento

  // Restante por Dia: Valor Restante / Dias até acabar
  const restantePorDia = diasAteAcabar && diasAteAcabar > 0 ? valorRestante / diasAteAcabar : null

  // Meta Custo por Resultado: Valor Plataforma / (Entrega Contratada / (KPI=CPM ? 1000 : 1))
  const divisorKpi = input.kpi === 'CPM' ? 1000 : 1
  const metaCustoResultado = entregaContratada > 0
    ? valorPlataforma / (entregaContratada / divisorKpi)
    : null

  // Gasto até o momento Bruto: Gasto / Coeficiente (TD apenas)
  const gastoAteMomentoBruto = coeficiente && coeficiente > 0
    ? gastoAteMomento / coeficiente
    : null

  // Valor Restante Bruto: Valor Bruto - Gasto até o momento Bruto
  const valorRestanteBruto = gastoAteMomentoBruto !== null
    ? valorBruto - gastoAteMomentoBruto
    : null

  // Pode abaixar a margem? TD apenas: Estimativa Sucesso > 150%
  const podeAbaixarMargem = !isFee && estimativaSucesso !== null
    ? estimativaSucesso > 150
    : null

  // Pode aumentar a margem? TD apenas: Estimativa Sucesso < 100%
  const podeAumentarMargem = !isFee && estimativaSucesso !== null
    ? estimativaSucesso < 100
    : null

  return {
    valorLiquido: valorLiquido || null,
    valorPlataforma: valorPlataforma || null,
    coeficiente,
    valorPorDiaPlataforma,
    percentualEntrega,
    custoResultado,
    estimativaResultado,
    estimativaSucesso,
    valorRestante: valorRestante || null,
    restantePorDia,
    metaCustoResultado,
    gastoAteMomentoBruto,
    valorRestanteBruto,
    podeAbaixarMargem,
    podeAumentarMargem,
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projetoId = searchParams.get('projeto_id')

    let query = supabaseAdmin
      .from(TABLES.estrategias)
      .select(`
        *,
        projeto:${TABLES.projetos}!projeto_id (
          id,
          nome,
          tipo_cobranca,
          data_fim
        )
      `)
      .order('created_at', { ascending: false })

    if (projetoId) {
      query = query.eq('projeto_id', parseInt(projetoId))
    }

    const { data: estrategias, error } = await query

    if (error) {
      console.error('Erro ao buscar estrategias:', error)
      return NextResponse.json({ error: 'Erro ao buscar estrategias' }, { status: 500 })
    }

    return NextResponse.json(estrategias)
  } catch (error) {
    console.error('Erro ao buscar estrategias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Buscar dados do projeto para cálculos
    const { data: projeto, error: projetoError } = await supabaseAdmin
      .from(TABLES.projetos)
      .select('tipo_cobranca, data_fim')
      .eq('id', data.projeto_id)
      .single()

    if (projetoError || !projeto) {
      console.error('Erro ao buscar projeto:', projetoError)
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const dataInicio = data.data_inicio ? new Date(data.data_inicio + 'T12:00:00') : null

    // Calcular todos os valores
    const valoresCalculados = calcularValoresEstrategia({
      valorBruto: data.valor_bruto || 0,
      porcentagemAgencia: data.porcentagem_agencia || 0,
      porcentagemPlataforma: data.porcentagem_plataforma || 0,
      entregaContratada: data.entrega_contratada || null,
      gastoAteMomento: data.gasto_ate_momento || null,
      entregueAteMomento: data.entregue_ate_momento || null,
      kpi: data.kpi || null,
      dataInicio,
      tipoCobranca: projeto.tipo_cobranca,
      dataFimProjeto: projeto.data_fim ? new Date(projeto.data_fim) : null,
    })

    // Preparar dados para inserção (snake_case)
    const insertData = {
      projeto_id: data.projeto_id,
      plataforma: data.plataforma,
      nome_conta: data.nome_conta || null,
      id_conta: data.id_conta || null,
      campaign_id: data.campaign_id || null,
      estrategia: data.estrategia || null,
      kpi: data.kpi || null,
      status: data.status || 'planejada',
      data_inicio: dataInicio?.toISOString(),
      valor_bruto: data.valor_bruto || 0,
      porcentagem_agencia: data.porcentagem_agencia || 0,
      porcentagem_plataforma: data.porcentagem_plataforma || 0,
      entrega_contratada: data.entrega_contratada || null,
      gasto_ate_momento: data.gasto_ate_momento || null,
      entregue_ate_momento: data.entregue_ate_momento || null,
      data_atualizacao: data.data_atualizacao ? new Date(data.data_atualizacao + 'T12:00:00').toISOString() : null,
      // Valores calculados (snake_case)
      valor_liquido: valoresCalculados.valorLiquido,
      valor_plataforma: valoresCalculados.valorPlataforma,
      coeficiente: valoresCalculados.coeficiente,
      valor_por_dia_plataforma: valoresCalculados.valorPorDiaPlataforma,
      percentual_entrega: valoresCalculados.percentualEntrega,
      custo_resultado: valoresCalculados.custoResultado,
      estimativa_resultado: valoresCalculados.estimativaResultado,
      estimativa_sucesso: valoresCalculados.estimativaSucesso,
      valor_restante: valoresCalculados.valorRestante,
      restante_por_dia: valoresCalculados.restantePorDia,
      meta_custo_resultado: valoresCalculados.metaCustoResultado,
      gasto_ate_momento_bruto: valoresCalculados.gastoAteMomentoBruto,
      valor_restante_bruto: valoresCalculados.valorRestanteBruto,
      pode_abaixar_margem: valoresCalculados.podeAbaixarMargem,
      pode_aumentar_margem: valoresCalculados.podeAumentarMargem,
    }

    const { data: estrategia, error } = await supabaseAdmin
      .from(TABLES.estrategias)
      .insert(insertData)
      .select(`
        *,
        projeto:${TABLES.projetos}!projeto_id (
          id,
          nome,
          tipo_cobranca,
          data_fim
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar estrategia:', error)
      return NextResponse.json({ error: 'Erro ao criar estrategia' }, { status: 500 })
    }

    return NextResponse.json(estrategia)
  } catch (error) {
    console.error('Erro ao criar estrategia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const data = await request.json()

    // Verificar se a estratégia existe e buscar dados do projeto
    const { data: existente, error: existenteError } = await supabaseAdmin
      .from(TABLES.estrategias)
      .select(`
        *,
        projeto:${TABLES.projetos}!projeto_id (
          tipo_cobranca,
          data_fim
        )
      `)
      .eq('id', parseInt(id))
      .single()

    if (existenteError || !existente) {
      console.error('Erro ao buscar estrategia:', existenteError)
      return NextResponse.json({ error: 'Estrategia nao encontrada' }, { status: 404 })
    }

    const dataInicio = data.data_inicio ? new Date(data.data_inicio + 'T12:00:00') : null

    // Calcular todos os valores
    const valoresCalculados = calcularValoresEstrategia({
      valorBruto: data.valor_bruto || 0,
      porcentagemAgencia: data.porcentagem_agencia || 0,
      porcentagemPlataforma: data.porcentagem_plataforma || 0,
      entregaContratada: data.entrega_contratada || null,
      gastoAteMomento: data.gasto_ate_momento || null,
      entregueAteMomento: data.entregue_ate_momento || null,
      kpi: data.kpi || null,
      dataInicio,
      tipoCobranca: existente.projeto.tipo_cobranca,
      dataFimProjeto: existente.projeto.data_fim ? new Date(existente.projeto.data_fim) : null,
    })

    // Preparar dados para atualização (snake_case)
    const updateData = {
      plataforma: data.plataforma,
      nome_conta: data.nome_conta || null,
      id_conta: data.id_conta || null,
      campaign_id: data.campaign_id || null,
      estrategia: data.estrategia || null,
      kpi: data.kpi || null,
      status: data.status,
      data_inicio: dataInicio?.toISOString(),
      valor_bruto: data.valor_bruto || 0,
      porcentagem_agencia: data.porcentagem_agencia || 0,
      porcentagem_plataforma: data.porcentagem_plataforma || 0,
      entrega_contratada: data.entrega_contratada || null,
      gasto_ate_momento: data.gasto_ate_momento || null,
      entregue_ate_momento: data.entregue_ate_momento || null,
      data_atualizacao: data.data_atualizacao ? new Date(data.data_atualizacao + 'T12:00:00').toISOString() : null,
      // Valores calculados (snake_case)
      valor_liquido: valoresCalculados.valorLiquido,
      valor_plataforma: valoresCalculados.valorPlataforma,
      coeficiente: valoresCalculados.coeficiente,
      valor_por_dia_plataforma: valoresCalculados.valorPorDiaPlataforma,
      percentual_entrega: valoresCalculados.percentualEntrega,
      custo_resultado: valoresCalculados.custoResultado,
      estimativa_resultado: valoresCalculados.estimativaResultado,
      estimativa_sucesso: valoresCalculados.estimativaSucesso,
      valor_restante: valoresCalculados.valorRestante,
      restante_por_dia: valoresCalculados.restantePorDia,
      meta_custo_resultado: valoresCalculados.metaCustoResultado,
      gasto_ate_momento_bruto: valoresCalculados.gastoAteMomentoBruto,
      valor_restante_bruto: valoresCalculados.valorRestanteBruto,
      pode_abaixar_margem: valoresCalculados.podeAbaixarMargem,
      pode_aumentar_margem: valoresCalculados.podeAumentarMargem,
    }

    const { data: estrategia, error } = await supabaseAdmin
      .from(TABLES.estrategias)
      .update(updateData)
      .eq('id', parseInt(id))
      .select(`
        *,
        projeto:${TABLES.projetos}!projeto_id (
          id,
          nome,
          tipo_cobranca,
          data_fim
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar estrategia:', error)
      return NextResponse.json({ error: 'Erro ao atualizar estrategia' }, { status: 500 })
    }

    return NextResponse.json(estrategia)
  } catch (error) {
    console.error('Erro ao atualizar estrategia:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: 'Erro interno', details: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from(TABLES.estrategias)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir estrategia:', error)
      return NextResponse.json({ error: 'Erro ao excluir estrategia' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir estrategia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
