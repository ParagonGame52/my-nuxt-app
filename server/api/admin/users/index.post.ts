export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const body = await readBody(event)
  const { name, email, password, balance = 0, is_admin = 0, tier = 'bronze', points = 0 } = body

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

  const validTier = ['bronze', 'silver', 'gold', 'platinum'].includes(String(tier).toLowerCase()) ? String(tier).toLowerCase() : 'bronze'
  const password_hash = hashPassword(password)
  await db.prepare(`
    INSERT INTO users (name, email, password_hash, balance, is_admin, tier, points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, email, password_hash, Number(balance), Number(is_admin), validTier, Number(points || 0))

  return { success: true }
})
