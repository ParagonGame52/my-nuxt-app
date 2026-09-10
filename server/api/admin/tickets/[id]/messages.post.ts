// POST /api/admin/tickets/[id]/messages — admin ส่งข้อความตอบกลับ
export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const { id } = event.context.params as { id: string }
  const body = await readBody(event)
  const { message, image_url } = body

  if ((!message || message.trim().length === 0) && !image_url) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อความหรือแนบรูปภาพ' })
  }

  const db = getDb()

  const ticket = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(Number(id))
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'ไม่พบ ticket' })

  await db.prepare(
    'INSERT INTO ticket_messages (ticket_id, sender, message, image_url) VALUES (?, ?, ?, ?)'
  ).run(Number(id), 'admin', (message || '').trim(), image_url || null)

  // อัพเดต status เป็น resolved และบันทึก admin_reply ล่าสุด
  await db.prepare(
    "UPDATE support_tickets SET status = 'resolved', admin_reply = ?, updated_at = NOW() WHERE id = ?"
  ).run((message || 'ส่งรูปภาพ').trim(), Number(id))

  return { success: true }
})
