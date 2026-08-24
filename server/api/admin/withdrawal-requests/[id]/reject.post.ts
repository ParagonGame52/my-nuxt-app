export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสรายการ' })

  const body = await readBody(event).catch(() => ({}))
  const note = body?.note || ''

  const db = getDb()
  const request = await db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(Number(id)) as any

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบรายการถอนเงินนี้' })
  }
  if (request.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'รายการนี้ได้รับการดำเนินการแล้ว' })
  }

  const executeReject = db.transaction(async () => {
    // คืนเงินให้ผู้ใช้
    await db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Number(request.amount), request.user_id)

    // เปลี่ยน status เป็น rejected + บันทึกหมายเหตุ
    await db.prepare(`
      UPDATE withdrawal_requests
      SET status = 'rejected', note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(note, request.id)
  })

  await executeReject()

  return { success: true }
})
