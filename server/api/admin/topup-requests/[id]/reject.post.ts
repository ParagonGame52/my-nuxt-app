export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสรายการ' })

  const db = getDb()
  const request = await db.prepare('SELECT * FROM topup_requests WHERE id = ?').get(Number(id)) as any

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบรายการเติมเงินนี้' })
  }

  if (request.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'รายการนี้ได้รับการดำเนินการแล้ว' })
  }

  await db.prepare(`
    UPDATE topup_requests 
    SET status = 'rejected', updated_at = datetime('now')
    WHERE id = ?
  `).run(request.id)

  return { success: true }
})
