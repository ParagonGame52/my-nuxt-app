export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, "id"))
  if (!id) throw createError({ statusCode: 400, statusMessage: "รหัสคำขอไม่ถูกต้อง" })

  const db = getDb()
  await db.prepare("DELETE FROM topup_requests WHERE id = ?").run(id)
  return { success: true, message: "ลบคำขอเติมเงินเรียบร้อยแล้ว" }
})
