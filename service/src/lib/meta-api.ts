import crypto from 'crypto'

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

export interface MetaPage {
  id: string
  name: string
  access_token: string
}

export interface MetaLeadForm {
  id: string
  name: string
  status: string
  leads_count?: number
}

export interface MetaFormQuestion {
  key: string
  label: string
  type: string
}

export function getMetaOAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    scope: 'pages_show_list,pages_manage_ads,leads_retrieval,pages_read_engagement',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    client_secret: process.env.META_APP_SECRET!,
    code,
  })
  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to exchange Meta code for token')
  }
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in?: number }>
}

export async function getLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  })
  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to get long-lived Meta token')
  }
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>
}

export async function getMetaUserInfo(accessToken: string) {
  const res = await fetch(`${META_GRAPH_URL}/me?fields=id,name,email&access_token=${accessToken}`)
  if (!res.ok) throw new Error('Failed to fetch Meta user info')
  return res.json() as Promise<{ id: string; name: string; email?: string }>
}

export async function getMetaPages(accessToken: string): Promise<MetaPage[]> {
  const res = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch Meta pages')
  const data = await res.json()
  return data.data || []
}

export async function getPageLeadForms(pageId: string, pageAccessToken: string): Promise<MetaLeadForm[]> {
  const res = await fetch(
    `${META_GRAPH_URL}/${pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${pageAccessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch lead forms')
  const data = await res.json()
  return data.data || []
}

export async function getFormFields(formId: string, pageAccessToken: string): Promise<MetaFormQuestion[]> {
  const res = await fetch(
    `${META_GRAPH_URL}/${formId}?fields=questions&access_token=${pageAccessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch form fields')
  const data = await res.json()
  return (data.questions || []).map((q: any) => ({
    key: q.key || q.id,
    label: q.label || q.key,
    type: q.type || 'CUSTOM',
  }))
}

export async function subscribePageToWebhook(pageId: string, pageAccessToken: string): Promise<boolean> {
  const res = await fetch(
    `${META_GRAPH_URL}/${pageId}/subscribed_apps`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['leadgen'],
        access_token: pageAccessToken,
      }),
    }
  )
  if (!res.ok) throw new Error('Failed to subscribe to webhook')
  const data = await res.json()
  return data.success === true
}

export async function getLeadData(leadId: string, pageAccessToken: string) {
  const res = await fetch(
    `${META_GRAPH_URL}/${leadId}?access_token=${pageAccessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch lead data')
  return res.json()
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!signature) return false
  const appSecret = process.env.META_APP_SECRET!
  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', appSecret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
