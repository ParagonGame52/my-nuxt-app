export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { name, email, newPassword, shipping_name, shipping_phone, shipping_address, avatar } = body

  if (!name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและอีเมล' })
  }

  const db = getDb()

  // Verify email uniqueness if email changed
  if (email !== user.email) {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'อีเมลนี้ถูกใช้งานแล้ว' })
    }
  }

  if (newPassword && newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  if (newPassword) {
    const hash = hashPassword(newPassword)
    await db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, shipping_name = ?, shipping_phone = ?, shipping_address = ?, avatar = COALESCE(?, avatar) WHERE id = ?')
      .run(name, email, hash, shipping_name || null, shipping_phone || null, shipping_address || null, avatar || null, user.id)
  } else {
    await db.prepare('UPDATE users SET name = ?, email = ?, shipping_name = ?, shipping_phone = ?, shipping_address = ?, avatar = COALESCE(?, avatar) WHERE id = ?')
      .run(name, email, shipping_name || null, shipping_phone || null, shipping_address || null, avatar || null, user.id)
  }

  return {
    success: true,
    user: {
      ...user,
      name,
      email,
      shipping_name: shipping_name || '',
      shipping_phone: shipping_phone || '',
      shipping_address: shipping_address || '',
      avatar: avatar || (user as any).avatar || ''
    }
  }
})
