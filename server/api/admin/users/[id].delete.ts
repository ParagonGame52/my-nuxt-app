export default defineEventHandler(async (event) => {
  const adminUser = await requireSuperAdmin(event)

  const { id } = event.context.params as { id: string }
  const targetId = Number(id)

  if (adminUser.id === targetId) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่สามารถลบบัญชีตัวเองได้' })
  }

  const db = getDb()
  try {
    await db.prepare('DELETE FROM product_reviews WHERE user_id = ?').run(targetId)
  } catch (e) {
    // Ignore if table does not exist
  }
  await db.prepare('DELETE FROM users WHERE id = ?').run(targetId)

  return { success: true, message: 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว' }
})
