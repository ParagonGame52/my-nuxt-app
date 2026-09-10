export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const db = getDb()
  
  // Get all orders
  const orders = await db.prepare(`
    SELECT id, total_price, status, created_at, payment_method, slip_image, shipping_name, shipping_phone, shipping_address, subtotal_price, shipping_cost, shipping_discount, tier_discount, tier_name
    FROM orders WHERE user_id = ? AND COALESCE(is_deleted, 0) = 0
    ORDER BY created_at DESC
  `).all(user.id) as any[]

  // Fetch items for each order
  const ordersWithItems = await Promise.all(orders.map(async (order) => {
    const items = await db.prepare(`
      SELECT product_id, product_name, product_price, quantity, product_img
      FROM order_items WHERE order_id = ?
    `).all(order.id)

    return {
      ...order,
      items
    }
  }))

  return { orders: ordersWithItems }
})
