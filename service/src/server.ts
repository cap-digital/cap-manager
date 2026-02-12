import express from 'express'
import { handleWebhookVerification, handleWebhookEvent } from './webhook-handler'

const app = express()
const PORT = process.env.PORT || 3001

// Raw body for signature verification
app.use('/webhooks/meta', express.raw({ type: 'application/json' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Meta webhook verification (GET)
app.get('/webhooks/meta', async (req, res) => {
  const result = await handleWebhookVerification(req.query as Record<string, string>)
  res.status(result.status)
  if (typeof result.body === 'string') {
    res.send(result.body)
  } else {
    res.json(result.body)
  }
})

// Meta webhook events (POST)
app.post('/webhooks/meta', async (req, res) => {
  const rawBody = (req.body as Buffer).toString('utf8')
  const signature = req.headers['x-hub-signature-256'] as string || ''
  const result = await handleWebhookEvent(rawBody, signature)
  res.status(result.status).json(result.body)
})

app.listen(PORT, () => {
  console.log(`[SERVICE] Automações service running on port ${PORT}`)
})
