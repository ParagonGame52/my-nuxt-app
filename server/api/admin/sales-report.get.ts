export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()

  // Total revenue and order count from completed orders
  const summary = await db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_price), 0) as total_revenue,
      COUNT(CASE WHEN status IN ('completed', 'success') THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status IN ('pending', 'pending_payment', 'processing', 'shipping') AND COALESCE(is_deleted, 0) = 0 THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
    FROM orders
  `).get() as any

  // Daily sales for last 7 days
  const dailySales = await db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count,
      COALESCE(SUM(total_price), 0) as revenue
    FROM orders
    WHERE created_at >= date('now', '-6 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all() as any[]

  // Top 5 best selling products
  const topProducts = await db.prepare(`
    SELECT
      oi.product_name,
      SUM(oi.quantity) as total_sold,
      SUM(oi.product_price * oi.quantity) as total_revenue
    FROM order_items oi
    GROUP BY oi.product_name
    ORDER BY total_sold DESC
    LIMIT 5
  `).all() as any[]

  // Total users
  const userStats = await db.prepare(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_admin = 0 THEN 1 END) as total_members
    FROM users
  `).get() as any

  return {
    summary,
    dailySales,
    topProducts,
    userStats
  }
})
