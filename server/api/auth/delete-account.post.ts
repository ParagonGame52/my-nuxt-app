export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' })
  }

  const body = await readBody(event)
  const { password } = body || {}

  if (!password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกรหัสผ่านเพื่อยืนยันการลบบัญชี' })
  }

  const db = getDb()

  // Get current user password hash
  const userRecord = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string } | undefined
  if (!userRecord || !verifyPassword(password, userRecord.password_hash)) {
    throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' })
  }

  // Delete all related records
  await db.prepare('DELETE FROM product_reviews WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM withdrawal_requests WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM support_tickets WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM topup_requests WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM orders WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
  await db.prepare('DELETE FROM users WHERE id = ?').run(user.id)

  deleteCookie(event, 'session_token', { path: '/' })

  return {
    success: true,
    message: 'ลบบัญชีผู้ใช้และข้อมูลทั้งหมดเรียบร้อยแล้ว'
  }
})
