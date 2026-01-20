export type TipoCobranca = 'td' | 'fee'
export type StatusProjeto = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
export type StatusEstrategia = 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
export type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'kwai' | 'tinder' | 'programatica' | 'outro'
export type GrupoRevisao = 'A' | 'B' | 'C'

export interface SimplifiedPi {
    id: number
    identificador: string
    valor_bruto: number
    cliente_id: number | null
}

export interface SimplifiedAgencia {
    id: number
    nome: string
}

export interface SimplifiedEstrategia {
    id: number
    projeto_id: number
    plataforma: Plataforma
    nome_conta: string | null
    id_conta: string | null
    campaign_id: string | null
    estrategia: string | null
    kpi: string | null
    status: StatusEstrategia
    valor_bruto: number
    porcentagem_agencia: number
    porcentagem_plataforma: number
    entrega_contratada: number | null
    estimativa_resultado: number | null
    estimativa_sucesso: number | null
    gasto_ate_momento: number | null
    entregue_ate_momento: number | null
    data_atualizacao: string | null
    observacao: string | null
    plataforma_custom: string | null
    created_at: string
    updated_at: string
}

export interface SimplifiedProjeto {
    id: number
    cliente_id: number
    nome: string
    pi_id: number | null
    pi: SimplifiedPi | null
    tipo_cobranca: TipoCobranca
    agencia_id: number | null
    agencia: SimplifiedAgencia | null
    trader_id: number | null
    colaborador_id: number | null
    status: StatusProjeto
    data_inicio: string | null
    data_fim: string | null
    link_proposta: string | null
    url_destino: string | null
    grupo_revisao: GrupoRevisao | null
    estrategias_count: number
    estrategias: SimplifiedEstrategia[]
    created_at: string
    updated_at: string
    cliente: { id: number; nome: string } | null
    trader: { id: number; nome: string } | null
    colaborador: { id: number; nome: string } | null
}
