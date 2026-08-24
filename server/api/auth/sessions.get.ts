export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบ' })
  }

  const currentToken = getCookie(event, 'session_token')
  const db = getDb()

  const sessions = await db.prepare(`
    SELECT id, token, expires_at, created_at, user_agent, ip_address
    FROM sessions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `).all(user.id) as {
    id: number
    token: string
    expires_at: string
    created_at: string
    user_agent: string
    ip_address: string
  }[]

  return {
    sessions: sessions.map(s => ({
      id: s.id,
      is_current: s.token === currentToken,
      created_at: s.created_at,
      expires_at: s.expires_at,
      user_agent: s.user_agent || 'เว็บเบราว์เซอร์',
      ip_address: s.ip_address || '127.0.0.1'
    }))
  }
})
