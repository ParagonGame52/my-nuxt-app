export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกอีเมลและรหัสผ่าน' })
  }

  const db = getDb()

  const user = await db.prepare(
    'SELECT id, name, email, password_hash, balance, is_admin, shipping_name, shipping_phone, shipping_address, avatar, points, total_spent, tier FROM users WHERE email = ?'
  ).get(email) as { id: number; name: string; email: string; password_hash: string; balance: number; is_admin: number; shipping_name: string | null; shipping_phone: string | null; shipping_address: string | null; avatar: string | null; points: number | null; total_spent: number | null; tier: string | null } | undefined

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  }

  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const userAgent = getHeader(event, 'user-agent') || 'เว็บเบราว์เซอร์'
  const ipAddress = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1'

  await db.prepare(
    'INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, token, expiresAt, userAgent, String(ipAddress))

  setCookie(event, 'session_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      is_admin: user.is_admin,
      shipping_name: user.shipping_name || '',
      shipping_phone: user.shipping_phone || '',
      shipping_address: user.shipping_address || '',
      avatar: user.avatar || '',
      points: Number(user.points || 0),
      total_spent: Number(user.total_spent || 0),
      tier: user.tier || 'bronze'
    }
  }
})
