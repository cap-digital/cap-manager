import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente público (para uso no frontend)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Cliente admin (para uso no backend - bypass RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const TABLES = {
  usuarios: 'cap_manager_usuarios',
  agencias: 'cap_manager_agencias',
  clientes: 'cap_manager_clientes',
  pis: 'cap_manager_pis',
  projetos: 'cap_manager_projetos',
  estrategias: 'cap_manager_estrategias',
  tarefas: 'cap_manager_tarefas',
  subtarefas: 'cap_manager_subtarefas',
  subtarefa_logs: 'cap_manager_subtarefa_logs',
  cards_kanban: 'cap_manager_cards_kanban',
  utm_configs: 'cap_manager_utm_configs',
  revisoes_diarias: 'cap_manager_revisoes_diarias',
  follow_ups: 'cap_manager_follow_ups',
  alertas: 'cap_manager_alertas',
  comentarios_tarefa: 'cap_manager_comentarios_tarefa',
  contratos: 'cap_manager_contratos',
  inteligencia_projetos: 'cap_manager_inteligencia_projetos',
  login_logs: 'cap_manager_login_logs',
} as const

// Tipos para o banco de dados
// ... (existente)

export interface Contrato {
  id: number
  cliente_id: number
  recorrente: boolean
  data_inicio: string
  data_fim?: string | null
  valor: number
  ativo: boolean
  pago?: boolean
  observacao?: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
}

// ... (interfaces existentes)


// Tipos para o banco de dados
export type Role = 'admin' | 'trader' | 'gestor' | 'cliente'
export type TipoCobranca = 'td' | 'fee'
export type StatusProjeto = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
export type GrupoRevisao = 'A' | 'B' | 'C'
export type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'kwai' | 'tinder' | 'programatica' | 'outro'
export type StatusEstrategia = 'planejada' | 'em_aprovacao' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
export type StatusTarefa = 'backlog' | 'todo' | 'doing' | 'review' | 'done'
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente'
export type TipoFollowUp = 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
export type TipoAlerta = 'cobranca' | 'campanha' | 'tarefa' | 'sistema' | 'mencao'
export type AreaKanban = 'gestao_trafego' | 'faturamento' | 'dashboards' | 'gtm' | 'sites_lp' | 'projetos_concluidos' | 'relatorios'
export type AcaoSubtarefa = 'criada' | 'atualizada' | 'concluida' | 'reaberta'

export interface Usuario {
  id: number
  email: string
  senha: string
  nome: string
  avatar_url?: string | null
  role: Role
  whatsapp?: string | null
  email_notificacoes?: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Agencia {
  id: number
  nome: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  contato?: string | null
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: number
  nome: string
  agencia_id?: number | null
  contato?: string | null
  cnpj?: string | null
  email?: string | null
  whatsapp?: string | null
  tipo_cobranca: TipoCobranca
  ativo: boolean
  created_at: string
  updated_at: string
  agencia?: Agencia | null
}

export interface Pi {
  id: number
  identificador: string
  valor_bruto: number
  agencia_id?: number | null
  cliente_id?: number | null
  created_at: string
  updated_at: string
  agencia?: Agencia | null
  cliente?: Cliente | null
}

export interface Projeto {
  id: number
  cliente_id: number
  nome: string
  pi_id?: number | null
  tipo_cobranca: TipoCobranca
  agencia_id?: number | null
  trader_id?: number | null
  colaborador_id?: number | null
  status: StatusProjeto
  data_inicio?: string | null
  data_fim?: string | null
  link_proposta?: string | null
  url_destino?: string | null
  grupo_revisao?: GrupoRevisao | null
  revisao_final_ok: boolean
  revisao_final_data?: string | null
  revisao_final_usuario_id?: number | null
  editado_por_id?: number | null
  editado_por_nome?: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  trader?: Usuario | null
  colaborador?: Usuario | null
  pi?: Pi | null
  agencia?: Agencia | null
  estrategias?: Estrategia[]
}

export interface Estrategia {
  id: number
  projeto_id: number
  plataforma: Plataforma
  nome_conta?: string | null
  id_conta?: string | null
  campaign_id?: string | null
  estrategia?: string | null
  kpi?: string | null
  status: StatusEstrategia
  data_inicio?: string | null
  valor_bruto: number
  porcentagem_agencia: number
  porcentagem_plataforma: number
  valor_liquido?: number | null
  valor_plataforma?: number | null
  coeficiente?: number | null
  valor_por_dia_plataforma?: number | null
  valor_restante?: number | null
  restante_por_dia?: number | null
  entrega_contratada?: number | null
  percentual_entrega?: number | null
  estimativa_resultado?: number | null
  estimativa_sucesso?: number | null
  meta_custo_resultado?: number | null
  custo_resultado?: number | null
  gasto_ate_momento_bruto?: number | null
  valor_restante_bruto?: number | null
  pode_abaixar_margem?: boolean | null
  pode_aumentar_margem?: boolean | null
  gasto_ate_momento?: number | null
  entregue_ate_momento?: number | null
  data_atualizacao?: string | null
  observacao?: string | null
  plataforma_custom?: string | null
  created_at: string
  updated_at: string
}

export interface Tarefa {
  id: number
  titulo: string
  descricao?: string | null
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  projeto_id?: number | null
  cliente_id?: number | null
  responsavel_id?: number | null
  data_vencimento?: string | null
  ordem: number
  created_at: string
  updated_at: string
  projeto?: Projeto | null
  cliente?: Cliente | null
  responsavel?: Usuario | null
}

export interface FollowUp {
  id: number
  projeto_id: number
  trader_id: number
  conteudo: string
  tipo: TipoFollowUp
  created_at: string
  projeto?: Projeto
  trader?: Usuario
}

export interface RevisaoDiaria {
  id: number
  projeto_id: number
  data_agendada: string
  revisado: boolean
  data_revisao?: string | null
  revisado_por_id?: number | null
  created_at: string
  updated_at: string
  projeto?: Projeto
  revisado_por?: Usuario | null
}

export interface UtmConfig {
  id: number
  projeto_id?: number | null
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term?: string | null
  utm_content?: string | null
  url_destino: string
  url_gerada: string
  created_at: string
  projeto?: Projeto | null
}

export interface Alerta {
  id: number
  tipo: TipoAlerta
  titulo: string
  mensagem: string
  destinatario_id: number
  lido: boolean
  enviado_whatsapp: boolean
  data_envio_whatsapp?: string | null
  created_at: string
  destinatario?: Usuario
}

export interface CardKanban {
  id: number
  titulo: string
  descricao?: string | null
  area: AreaKanban
  status: string
  prioridade: PrioridadeTarefa
  cliente_id?: number | null
  projeto_id?: number | null
  trader_id?: number | null
  responsavel_relatorio_id?: number | null
  responsavel_revisao_id?: number | null
  revisao_relatorio_ok: boolean
  link_relatorio?: string | null
  faturamento_card_id?: number | null
  data_vencimento?: string | null
  data_inicio?: string | null
  observador_id?: number | null
  categoria?: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface Subtarefa {
  id: number
  tarefa_id: number
  titulo: string
  descricao?: string | null
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  data_vencimento?: string | null
  responsavel_id?: number | null
  data_finalizacao?: string | null
  concluida: boolean
  created_at: string
  updated_at: string
  responsavel?: Usuario | null
}

export interface SubtarefaLog {
  id: number
  subtarefa_id: number
  usuario_id?: number | null
  acao: AcaoSubtarefa
  descricao?: string | null
  created_at: string
  usuario?: Usuario | null
}

export interface Comentario {
  id: number
  tarefa_id: number
  usuario_id: number
  conteudo: string
  created_at: string
  usuario?: Usuario | null
}

export type TipoProjeto = 'Landing Page' | 'Site' | 'Dashboard' | 'Automação' | 'CRM' | 'GTM/GA4' | 'Outro' | 'lp' | 'saas'

export interface InteligenciaProjeto {
  id: number
  nome_projeto: string
  tipo_projeto?: TipoProjeto | string | null
  data_criacao?: string | null
  link_lovable?: string | null
  link_vercel?: string | null
  link_render_railway?: string | null
  link_dominio?: string | null
  link_looker_studio?: string | null
  feito_por_id?: number | null
  revisado_por_id?: number | null
  cliente_id?: number | null
  created_at: string
  updated_at: string
  cliente?: Cliente | null
  feito_por?: Usuario | null
  revisado_por?: Usuario | null
}

