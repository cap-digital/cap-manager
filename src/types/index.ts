// ==================== AGÊNCIA ====================
export interface Agencia {
  id: string
  nome: string
  porcentagem: number
  local: string
  created_at: string
  updated_at: string
}

export interface AgenciaFormData {
  nome: string
  porcentagem: number
  local: string
}

// ==================== CLIENTE ====================
export interface Cliente {
  id: string
  nome: string
  agencia_id: string | null
  agencia?: Agencia
  link_drive: string | null
  contato: string
  cnpj: string | null
  email: string
  dia_cobranca: number
  forma_pagamento: 'pix' | 'boleto' | 'cartao' | 'transferencia'
  whatsapp: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ClienteFormData {
  nome: string
  agencia_id: string | null
  link_drive: string | null
  contato: string
  cnpj: string | null
  email: string
  dia_cobranca: number
  forma_pagamento: 'pix' | 'boleto' | 'cartao' | 'transferencia'
  whatsapp: string | null
}

// ==================== PI ====================
export interface Pi {
  id: string
  identificador: string
  valor_bruto: number
  projetos_count: number
  created_at: string
  updated_at: string
}

export interface PiFormData {
  identificador: string
  valor_bruto: number
}

// ==================== PROJETO ====================
export type ProjetoStatus = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
export type TipoCobranca = 'td' | 'fee'
export type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'programatica' | 'outro'

export interface Projeto {
  id: string
  cliente_id: string
  cliente?: Cliente
  nome: string
  pi_id: string | null
  pi?: Pi
  tipo_cobranca: TipoCobranca
  agencia_id: string | null
  agencia?: Agencia
  trader_id: string | null
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
  cliente_id: string
  nome: string
  pi_id: string | null
  tipo_cobranca: TipoCobranca
  agencia_id: string | null
  trader_id: string | null
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
  id: string
  projeto_id: string
  projeto?: Projeto
  plataforma: Plataforma
  nome_conta: string | null
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
  projeto_id: string
  plataforma: Plataforma
  nome_conta: string | null
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
  id: string
  titulo: string
  descricao: string | null
  status: TarefaStatus
  prioridade: TarefaPrioridade
  projeto_id: string | null
  projeto?: Projeto
  cliente_id: string | null
  cliente?: Cliente
  responsavel_id: string | null
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
  projeto_id: string | null
  cliente_id: string | null
  responsavel_id: string | null
  data_vencimento: string | null
}

// ==================== FOLLOW UP ====================
export interface FollowUp {
  id: string
  projeto_id: string
  projeto?: Projeto
  trader_id: string
  trader?: Usuario
  conteudo: string
  tipo: 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
  created_at: string
}

export interface FollowUpFormData {
  projeto_id: string
  conteudo: string
  tipo: 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
}

// ==================== USUÁRIO ====================
export type UsuarioRole = 'admin' | 'trader' | 'gestor' | 'cliente'

export interface Usuario {
  id: string
  email: string
  nome: string
  avatar_url: string | null
  role: UsuarioRole
  whatsapp: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

// ==================== UTM ====================
export interface UTMConfig {
  id: string
  projeto_id: string
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
  projeto_id: string
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
  id: string
  tipo: AlertaTipo
  titulo: string
  mensagem: string
  destinatario_id: string
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
