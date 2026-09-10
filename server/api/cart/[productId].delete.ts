export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const db = getDb()
  await db.prepare(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
  ).run(user.id, Number(productId))

  return { success: true }
})
