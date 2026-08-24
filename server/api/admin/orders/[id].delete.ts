export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสคำสั่งซื้อ' })

  const db = getDb()

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as any
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำสั่งซื้อนี้' })
  }

  // If order was not cancelled or failed, restore stock first
  if (order.status !== 'cancelled' && order.status !== 'rejected') {
    const items = await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(Number(id)) as { product_id: number; quantity: number }[]
    for (const item of items) {
      await db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id)
    }
  }

  // Soft delete order so sales report revenue figures remain accurate
  await db.prepare('UPDATE orders SET is_deleted = 1 WHERE id = ?').run(Number(id))

  return { success: true, message: 'ลบรายการคำสั่งซื้อเรียบร้อยแล้ว' }
})
