// ==================== AGÊNCIA ====================
export interface Agencia {
  id: number
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  contato: string | null
  created_at: string
  updated_at: string
}

export interface AgenciaFormData {
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  contato: string | null
}

// ==================== CLIENTE ====================
export interface Cliente {
  id: number
  nome: string
  agencia_id: number | null
  agencia?: Agencia
  contato: string | null
  cnpj: string | null
  email: string | null
  whatsapp: string | null
  tipo_cobranca: 'td' | 'fee'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ClienteFormData {
  nome: string
  agencia_id: number | null
  contato: string | null
  cnpj: string | null
  email: string | null
  whatsapp: string | null
  tipo_cobranca: 'td' | 'fee'
}

// ==================== PI ====================
export interface Pi {
  id: number
  identificador: string
  valor_bruto: number
  agencia_id: number | null
  agencia?: Agencia
  cliente_id: number | null
  cliente?: Cliente
  projetos_count: number
  created_at: string
  updated_at: string
}

export interface PiFormData {
  identificador: string
  valor_bruto: number
  agencia_id: number | null
  cliente_id: number | null
}

// ==================== PROJETO ====================
export type ProjetoStatus = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
export type TipoCobranca = 'td' | 'fee'
export type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'programatica' | 'outro'

export interface Projeto {
  id: number
  cliente_id: number
  cliente?: Cliente
  nome: string
  pi_id: number | null
  pi?: Pi
  tipo_cobranca: TipoCobranca
  agencia_id: number | null
  agencia?: Agencia
  trader_id: number | null
  trader?: Usuario
  status: ProjetoStatus
  data_inicio: string | null
  data_fim: string | null
  link_proposta: string | null
  praca: string | null
  publico: string | null
  url_destino: string | null
  created_at: string
  updated_at: string
  estrategias?: Estrategia[]
}

export interface ProjetoFormData {
  cliente_id: number | null
  nome: string
  pi_id: number | null
  tipo_cobranca: TipoCobranca
  agencia_id: number | null
  trader_id: number | null
  status: ProjetoStatus
  data_inicio: string | null
  data_fim: string | null
  link_proposta: string | null
  praca: string | null
  publico: string | null
  url_destino: string | null
}

// ==================== ESTRATEGIA ====================
export type EstrategiaStatus = 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'

export interface Estrategia {
  id: number
  projeto_id: number
  projeto?: Projeto
  plataforma: Plataforma
  nome_conta: string | null
  id_conta: string | null
  estrategia: string | null
  kpi: string | null
  status: EstrategiaStatus
  valor_bruto: number
  porcentagem_agencia: number
  porcentagem_plataforma: number
  entrega_contratada: number | null
  gasto_ate_momento: number | null
  entregue_ate_momento: number | null
  data_atualizacao: string | null
  created_at: string
  updated_at: string
}

export interface EstrategiaFormData {
  projeto_id: number
  plataforma: Plataforma
  nome_conta: string | null
  id_conta: string | null
  estrategia: string | null
  kpi: string | null
  status: EstrategiaStatus
  valor_bruto: number
  porcentagem_agencia: number
  porcentagem_plataforma: number
  entrega_contratada: number | null
  gasto_ate_momento: number | null
  entregue_ate_momento: number | null
  data_atualizacao: string | null
}

// ==================== TAREFA (KANBAN) ====================
export type TarefaStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'done'
export type TarefaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'

export interface Tarefa {
  id: number
  titulo: string
  descricao: string | null
  status: TarefaStatus
  prioridade: TarefaPrioridade
  projeto_id: number | null
  projeto?: Projeto
  cliente_id: number | null
  cliente?: Cliente
  responsavel_id: number | null
  responsavel?: Usuario
  data_vencimento: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface TarefaFormData {
  titulo: string
  descricao: string | null
  status: TarefaStatus
  prioridade: TarefaPrioridade
  projeto_id: number | null
  cliente_id: number | null
  responsavel_id: number | null
  data_vencimento: string | null
}

// ==================== FOLLOW UP ====================
export interface FollowUp {
  id: number
  projeto_id: number
  projeto?: Projeto
  trader_id: number
  trader?: Usuario
  conteudo: string
  tipo: 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
  created_at: string
}

export interface FollowUpFormData {
  projeto_id: number
  conteudo: string
  tipo: 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
}

// ==================== USUÁRIO ====================
export type UsuarioRole = 'admin' | 'trader' | 'gestor' | 'cliente'

export interface Usuario {
  id: number
  email: string
  nome: string
  avatar_url: string | null
  role: UsuarioRole
  whatsapp: string | null
  email_notificacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

// ==================== UTM ====================
export interface UTMConfig {
  id: number
  projeto_id: number
  projeto?: Projeto
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string | null
  utm_content: string | null
  url_destino: string
  url_gerada: string
  created_at: string
}

export interface UTMFormData {
  projeto_id: number
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string | null
  utm_content: string | null
  url_destino: string
}

// ==================== ALERTAS ====================
export type AlertaTipo = 'cobranca' | 'campanha' | 'tarefa' | 'sistema'

export interface Alerta {
  id: number
  tipo: AlertaTipo
  titulo: string
  mensagem: string
  destinatario_id: number
  destinatario?: Usuario
  lido: boolean
  enviado_whatsapp: boolean
  data_envio_whatsapp: string | null
  created_at: string
}

// ==================== NOMENCLATURA ====================
export interface NomenclaturaConfig {
  plataforma: string
  tipo_campanha: string
  objetivo: string
  segmentacao: string
  formato: string
  data: string
}
// ==================== INTELIGÊNCIA PROJETOS ====================
export interface InteligenciaProjeto {
  id: number
  nome_projeto: string
  data_criacao: string | null
  link_lovable: string | null
  link_vercel: string | null
  link_render_railway: string | null
  link_dominio: string | null
  feito_por_id: number | null
  revisado_por_id: number | null
  cliente_id: number | null
  cliente?: Cliente
  feito_por?: Usuario
  revisado_por?: Usuario
  created_at: string
  updated_at: string
}
