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

  const executeApproval = db.transaction(async () => {
    // 1. Add balance to user
    await db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Number(request.amount), request.user_id)
    
    // 2. Mark request approved
    await db.prepare(`
      UPDATE topup_requests 
      SET status = 'approved', updated_at = datetime('now')
      WHERE id = ?
    `).run(request.id)
  })

  try {
    await executeApproval()
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: 'ดำเนินการล้มเหลว: ' + error.message })
  }
})
