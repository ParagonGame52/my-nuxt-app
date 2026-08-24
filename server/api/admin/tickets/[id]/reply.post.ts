export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const { id } = event.context.params as { id: string }
  const body = await readBody(event)
  const { reply } = body

  if (!reply || reply.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อความตอบกลับ' })
  }

  const db = getDb()
  await db.prepare(`
    UPDATE support_tickets
    SET admin_reply = ?, status = 'resolved', updated_at = datetime('now')
    WHERE id = ?
  `).run(reply.trim(), Number(id))

  return { success: true }
})
