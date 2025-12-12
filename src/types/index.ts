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

// ==================== CAMPANHA ====================
export type CampanhaStatus = 'rascunho' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
export type CampanhaObjetivo = 'awareness' | 'consideracao' | 'conversao' | 'leads' | 'vendas' | 'trafego' | 'engajamento'

export interface Campanha {
  id: string
  cliente_id: string
  cliente?: Cliente
  nome: string
  pi: string | null
  porcentagem_plataforma: number
  porcentagem_agencia: number
  trader_id: string | null
  trader?: Usuario
  objetivo: CampanhaObjetivo
  status: CampanhaStatus
  id_campanha_plataforma: string
  data_inicio: string | null
  data_fim: string | null
  orcamento: number | null
  nomenclatura_padrao: string | null
  created_at: string
  updated_at: string
}

export interface CampanhaFormData {
  cliente_id: string
  nome: string
  pi: string | null
  porcentagem_plataforma: number
  porcentagem_agencia: number
  trader_id: string | null
  objetivo: CampanhaObjetivo
  status: CampanhaStatus
  id_campanha_plataforma: string
  data_inicio: string | null
  data_fim: string | null
  orcamento: number | null
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
  campanha_id: string | null
  campanha?: Campanha
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
  campanha_id: string | null
  cliente_id: string | null
  responsavel_id: string | null
  data_vencimento: string | null
}

// ==================== FOLLOW UP ====================
export interface FollowUp {
  id: string
  campanha_id: string
  campanha?: Campanha
  trader_id: string
  trader?: Usuario
  conteudo: string
  tipo: 'nota' | 'alerta' | 'atualizacao' | 'reuniao'
  created_at: string
}

export interface FollowUpFormData {
  campanha_id: string
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
  campanha_id: string
  campanha?: Campanha
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
  campanha_id: string
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
