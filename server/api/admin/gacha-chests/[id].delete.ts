export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสตู้สุ่ม' })

  const db = getDb()
  try {
    await db.prepare('DELETE FROM gacha_chests WHERE id = ?').run(Number(id))
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'ลบตู้สุ่มล้มเหลว: ' + err.message })
  }
})
