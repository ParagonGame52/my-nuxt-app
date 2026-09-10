// GET /api/tickets/[id]/messages — ดึงข้อความทั้งหมดของ ticket
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const { id } = event.context.params as { id: string }
  const db = getDb()

  // ตรวจสอบว่า ticket เป็นของ user คนนี้ (หรือ admin ทุกระดับ is_admin >= 1)
  const ticket = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(Number(id))
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ ticket' })
  if (ticket.user_id !== user.id && (!user.is_admin || user.is_admin < 1)) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const messages = await db.prepare(
    'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
  ).all(Number(id))

  return { messages, ticket }
})
