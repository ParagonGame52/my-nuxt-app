export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, "id"))
  if (!id) throw createError({ statusCode: 400, statusMessage: "รหัสตั๋วปัญหาไม่ถูกต้อง" })

  const db = getDb()
  await db.prepare("DELETE FROM support_tickets WHERE id = ?").run(id)
  return { success: true, message: "ลบตั๋วปัญหาเรียบร้อยแล้ว" }
})
