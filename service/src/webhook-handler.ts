import { supabaseAdmin, TABLES } from './lib/supabase'
import { decrypt } from './lib/encryption'
import { getLeadData, verifyWebhookSignature } from './lib/meta-api'
import { appendToSheet, refreshGoogleAccessToken } from './lib/google-sheets'
import { encrypt } from './lib/encryption'
import type { AutomacaoRecord, GoogleConnection } from './types'

export async function handleWebhookVerification(query: Record<string, string>): Promise<{ status: number; body: any }> {
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verification successful')
    return { status: 200, body: challenge }
  }

  return { status: 403, body: { error: 'Verification failed' } }
}

export async function handleWebhookEvent(rawBody: string, signature: string): Promise<{ status: number; body: any }> {
  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[WEBHOOK] Invalid signature')
    return { status: 403, body: { error: 'Invalid signature' } }
  }

  const body = JSON.parse(rawBody)

  if (body.object !== 'page') {
    return { status: 200, body: { received: true } }
  }

  // Process each entry
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'leadgen') {
        await processLead(change.value)
      }
    }
  }

  return { status: 200, body: { received: true } }
}

async function processLead(leadEvent: { page_id: string; form_id: string; leadgen_id: string }) {
  const { page_id, form_id, leadgen_id } = leadEvent

  console.log(`[WEBHOOK] Processing lead: ${leadgen_id} from page ${page_id}, form ${form_id}`)

  // Find matching automation
  const { data: automacao } = await supabaseAdmin
    .from(TABLES.automacoes)
    .select('*')
    .eq('meta_page_id', page_id)
    .eq('meta_form_id', form_id)
    .eq('status', 'ativa')
    .single()

  if (!automacao) {
    console.warn(`[WEBHOOK] No active automation for page ${page_id}, form ${form_id}`)
    return
  }

  const auto = automacao as AutomacaoRecord

  // Check idempotency
  const { count } = await supabaseAdmin
    .from(TABLES.automacao_logs)
    .select('*', { count: 'exact', head: true })
    .eq('automacao_id', auto.id)
    .eq('lead_id', leadgen_id)
    .eq('tipo', 'lead_recebido')

  if (count && count > 0) {
    console.log(`[WEBHOOK] Lead ${leadgen_id} already processed`)
    return
  }

  try {
    // Decrypt page token
    const pageToken = decrypt(auto.meta_page_token_encrypted!)

    // Fetch lead data from Meta
    const leadData = await getLeadData(leadgen_id, pageToken)
    const fieldData = (leadData.field_data || []) as { name: string; values: string[] }[]

    // Map fields to sheet columns
    const mapping = auto.field_mapping || []
    const headers = mapping.map(m => m.sheet_column)
    const values = mapping.map(m => {
      const field = fieldData.find(f => f.name === m.form_field)
      return field?.values?.[0] || ''
    })

    // Get Google connection
    const { data: googleConn } = await supabaseAdmin
      .from(TABLES.google_connections)
      .select('*')
      .eq('id', auto.google_connection_id)
      .single()

    if (!googleConn) throw new Error('Google connection not found')

    const gc = googleConn as GoogleConnection
    let accessToken = decrypt(gc.access_token_encrypted)
    const refreshToken = decrypt(gc.refresh_token_encrypted)

    // Refresh token if expired
    if (gc.token_expires_at && new Date(gc.token_expires_at) < new Date()) {
      const refreshed = await refreshGoogleAccessToken(refreshToken)
      accessToken = refreshed.access_token
      await supabaseAdmin
        .from(TABLES.google_connections)
        .update({
          access_token_encrypted: encrypt(accessToken),
          token_expires_at: new Date(refreshed.expiry_date).toISOString(),
        })
        .eq('id', gc.id)
    }

    // Append to Google Sheet
    await appendToSheet(accessToken, refreshToken, auto.spreadsheet_id!, auto.sheet_name!, values)

    // Log success
    await supabaseAdmin.from(TABLES.automacao_logs).insert({
      automacao_id: auto.id,
      tipo: 'lead_recebido',
      mensagem: `Lead ${leadgen_id} processado com sucesso`,
      dados: { lead_data: fieldData, mapped_values: values },
      lead_id: leadgen_id,
    })

    // Update stats
    await supabaseAdmin
      .from(TABLES.automacoes)
      .update({ leads_count: auto.leads_count + 1, last_lead_at: new Date().toISOString() })
      .eq('id', auto.id)

    console.log(`[WEBHOOK] Lead ${leadgen_id} processed successfully`)
  } catch (error: any) {
    console.error(`[WEBHOOK] Error processing lead ${leadgen_id}:`, error)

    // Log error
    await supabaseAdmin.from(TABLES.automacao_logs).insert({
      automacao_id: auto.id,
      tipo: 'erro',
      mensagem: `Erro ao processar lead ${leadgen_id}: ${error.message}`,
      dados: { error: error.message },
      lead_id: leadgen_id,
    })

    // Auto-mark as error after 5 failures in 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: errorCount } = await supabaseAdmin
      .from(TABLES.automacao_logs)
      .select('*', { count: 'exact', head: true })
      .eq('automacao_id', auto.id)
      .eq('tipo', 'erro')
      .gte('created_at', oneHourAgo)

    if (errorCount && errorCount >= 5) {
      await supabaseAdmin
        .from(TABLES.automacoes)
        .update({ status: 'erro' })
        .eq('id', auto.id)
    }
  }
}
