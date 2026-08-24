export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { title, category, message, image_url } = body

  if (!title || !category || (!message && !image_url)) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }

  const db = getDb()
  const res = await db.prepare(`
    INSERT INTO support_tickets (user_id, title, category, message, image_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, title, category, message || '', image_url || null)

  const ticketId = res.lastInsertRowid
  if (ticketId) {
    await db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender, message, image_url)
      VALUES (?, ?, ?, ?)
    `).run(ticketId, 'user', message || '', image_url || null)
  }

  return { success: true, ticketId }
})
