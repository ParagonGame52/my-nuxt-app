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
  if (order.status !== 'pending_payment') {
    throw createError({ statusCode: 400, statusMessage: 'คำสั่งซื้อนี้ไม่ได้อยู่ในสถานะรอยืนยัน' })
  }

  const orderIdNum = Number(id)
  const orderUser = await db.prepare('SELECT total_spent, points, tier FROM users WHERE id = ?').get(order.user_id) as any
  if (orderUser) {
    const totalPrice = Number(order.total_price || 0)
    const currentSpent = Number(orderUser.total_spent || 0) + totalPrice
    const currentTier = orderUser.tier || 'bronze'
    const earnedPoints = calculateEarnedPoints(totalPrice, currentTier)
    const newTotalPoints = Number(orderUser.points || 0) + earnedPoints
    const newTier = calculateTier(currentSpent)

    await db.prepare('UPDATE users SET total_spent = ?, points = ?, tier = ? WHERE id = ?')
      .run(currentSpent, newTotalPoints, newTier, order.user_id)
  }

  // Update order status to pending (ready for fulfillment)
  await db.prepare(`
    UPDATE orders SET status = 'pending' WHERE id = ?
  `).run(orderIdNum)

  return { success: true, message: 'อนุมัติคำสั่งซื้อเรียบร้อย' }
})
