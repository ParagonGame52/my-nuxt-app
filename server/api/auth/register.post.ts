export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  const db = getDb()

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'อีเมลนี้ถูกใช้งานแล้ว' })
  }

  const password_hash = hashPassword(password)
  const result = await db.prepare(
    'INSERT INTO users (name, email, password_hash, balance, is_admin) VALUES (?, ?, ?, 0, 0)'
  ).run(name, email, password_hash)

  const userId = result.lastInsertRowid as number
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const userAgent = getHeader(event, 'user-agent') || 'เว็บเบราว์เซอร์'
  const ipAddress = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1'

  await db.prepare(
    'INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, token, expiresAt, userAgent, String(ipAddress))

  setCookie(event, 'session_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })

  return {
    user: {
      id: userId,
      name,
      email,
      balance: 0,
      is_admin: 0,
      shipping_name: '',
      shipping_phone: '',
      shipping_address: '',
      avatar: '',
      points: 0,
      total_spent: 0,
      tier: 'bronze'
    }
  }
})
