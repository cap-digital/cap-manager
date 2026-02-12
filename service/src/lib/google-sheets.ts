import { google } from 'googleapis'

function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${process.env.SERVICE_URL}/oauth/google/callback`
  )
}

export function getGoogleSheetsAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
  })
}

export async function exchangeGoogleCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()
  return data.email || ''
}

export async function listSpreadsheets(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const { data } = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'files(id,name)',
    pageSize: 50,
    orderBy: 'modifiedTime desc',
  })
  return data.files || []
}

export async function getSheetNames(accessToken: string, refreshToken: string, spreadsheetId: string): Promise<string[]> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  const { data } = await sheets.spreadsheets.get({ spreadsheetId })
  return (data.sheets || []).map(s => s.properties?.title || '').filter(Boolean)
}

export async function getSheetHeaders(
  accessToken: string,
  refreshToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!1:1`,
  })
  return (data.values?.[0] as string[]) || []
}

export async function appendToSheet(
  accessToken: string,
  refreshToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[]
): Promise<void> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
}

export async function setSheetHeaders(
  accessToken: string,
  refreshToken: string,
  spreadsheetId: string,
  sheetName: string,
  headers: string[]
): Promise<void> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  const range = `'${sheetName}'!A1:${String.fromCharCode(64 + headers.length)}1`
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  })
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ access_token: string; expiry_date: number }> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date!,
  }
}
