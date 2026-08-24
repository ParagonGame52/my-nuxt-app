export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const { id } = event.context.params as { id: string }
  const body = await readBody(event)
  const { status } = body

  const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'success']
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'สถานะไม่ถูกต้อง' })
  }

  const db = getDb()

  const order = await db.prepare('SELECT status FROM orders WHERE id = ?').get(Number(id)) as { status: string } | undefined
  if (order && status === 'cancelled' && order.status !== 'cancelled') {
    const items = await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(Number(id)) as { product_id: number; quantity: number }[]
    for (const item of items) {
      await db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id)
    }
  }

  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, Number(id))

  return { success: true }
})
