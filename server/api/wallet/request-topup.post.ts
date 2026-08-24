export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { amount, slip_url } = body

  if (!amount || Number(amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'จำนวนเงินไม่ถูกต้อง' })
  }

  if (!slip_url) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาแนบสลิปยืนยันการโอนเงิน' })
  }

  const db = getDb()
  await db.prepare(`
    INSERT INTO topup_requests (user_id, amount, status, slip_url)
    VALUES (?, ?, 'pending', ?)
  `).run(user.id, Number(amount), slip_url)

  return { success: true }
})
