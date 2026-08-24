// POST /api/tickets/[id]/messages — user ส่งข้อความใหม่ใน ticket
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const { id } = event.context.params as { id: string }
  const body = await readBody(event)
  const { message, image_url } = body

  if ((!message || message.trim().length === 0) && !image_url) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อความหรือแนบรูปภาพ' })
  }

  const db = getDb()

  // ตรวจสอบว่า ticket เป็นของ user คนนี้
  const ticket = await db.prepare(
    'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?'
  ).get(Number(id), user.id)
  if (!ticket) throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })

  await db.prepare(
    'INSERT INTO ticket_messages (ticket_id, sender, message, image_url) VALUES (?, ?, ?, ?)'
  ).run(Number(id), 'user', (message || '').trim(), image_url || null)

  // ถ้าถูก resolved ไปแล้วและ user ส่งมาใหม่ ให้เปิดใหม่
  await db.prepare(
    "UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = ?"
  ).run(Number(id))

  return { success: true }
})
