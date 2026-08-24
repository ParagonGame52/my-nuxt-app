export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const orders = await db.prepare(`
    SELECT o.id, o.user_id, u.name as user_name, u.email as user_email,
           o.total_price, o.status, o.created_at, o.payment_method, o.slip_image,
           o.shipping_name, o.shipping_phone, o.shipping_address
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE COALESCE(o.is_deleted, 0) = 0
    ORDER BY o.created_at DESC
  `).all() as any[]

  const orderItems = await db.prepare(`
    SELECT oi.order_id, oi.product_id, oi.product_name, oi.product_price, oi.quantity
    FROM order_items oi
  `).all() as any[]

  const itemsByOrder = new Map<number, any[]>()
  for (const item of orderItems) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id)!.push(item)
  }

  const result = orders.map(o => ({
    ...o,
    items: itemsByOrder.get(o.id) || []
  }))

  return { orders: result }
})
