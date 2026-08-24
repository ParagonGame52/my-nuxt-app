export default defineEventHandler(async (event) => {
  const user = await requireSuperAdmin(event)

  const query = getQuery(event)
  const targetStatus = query.status ? String(query.status) : 'all'

  const db = getDb()

  if (targetStatus === 'all') {
    // Get active orders to restore stock before wiping
    const activeOrders = await db.prepare("SELECT id FROM orders WHERE status NOT IN ('cancelled', 'rejected') AND COALESCE(is_deleted, 0) = 0").all() as { id: number }[]
    for (const ord of activeOrders) {
      const items = await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(ord.id) as { product_id: number; quantity: number }[]
      for (const item of items) {
        await db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id)
      }
    }

    // Soft delete all active orders so revenue analytics are preserved
    await db.prepare('UPDATE orders SET is_deleted = 1 WHERE COALESCE(is_deleted, 0) = 0').run()

    return { success: true, message: 'ลบรายการคำสั่งซื้อทั้งหมดเรียบร้อยแล้ว' }
  } else {
    // Target specific status
    const targetOrders = await db.prepare("SELECT id, status FROM orders WHERE status = ? AND COALESCE(is_deleted, 0) = 0").all(targetStatus) as { id: number; status: string }[]
    if (targetOrders.length === 0) {
      return { success: true, message: 'ไม่พบรายการคำสั่งซื้อในสถานะที่เลือก' }
    }

    for (const ord of targetOrders) {
      if (ord.status !== 'cancelled' && ord.status !== 'rejected') {
        const items = await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(ord.id) as { product_id: number; quantity: number }[]
        for (const item of items) {
          await db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id)
        }
      }
    }
    await db.prepare('UPDATE orders SET is_deleted = 1 WHERE status = ? AND COALESCE(is_deleted, 0) = 0').run(targetStatus)

    return { success: true, message: `ลบรายการคำสั่งซื้อสถานะ "${targetStatus}" เรียบร้อยแล้ว` }
  }
})
