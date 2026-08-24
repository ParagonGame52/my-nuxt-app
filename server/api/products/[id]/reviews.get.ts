// Public API — ดึงรีวิวทั้งหมดของสินค้า พร้อม summary และสถานะรีวิวของผู้ใช้ปัจจุบัน
export default defineEventHandler(async (event) => {
  const productId = Number(getRouterParam(event, 'id'))
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const db = getDb()
  const user = await getUserFromEvent(event)

  // ดึงรีวิวพร้อมข้อมูลผู้ใช้
  const reviews = await db.prepare(`
    SELECT
      r.id,
      r.product_id,
      r.user_id,
      r.rating,
      r.title,
      r.body,
      r.created_at,
      COALESCE(u.name, 'ผู้ใช้งาน') AS user_name,
      u.avatar AS user_avatar
    FROM product_reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(productId)

  // คำนวณ summary
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
    : 0

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews as any[]) {
    ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1
  }

  let userReview = null
  let canReview = false
  let purchaseStatusMessage = ''

  if (user) {
    userReview = reviews.find((r: any) => r.user_id === user.id) || null

    if (user.is_admin) {
      // ผู้ดูแลระบบ (Admin) มีสิทธิ์รีวิวและทดสอบสินค้าได้ทุกชิ้น
      canReview = true
    } else {
      // ผู้ใช้ทั่วไป: ตรวจสอบว่าเคยสั่งซื้อสินค้านี้แล้วหรือไม่ (สถานะที่ชำระเงินแล้ว)
      const purchase = await db.prepare(`
        SELECT o.id, o.status
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = ?
          AND oi.product_id = ?
          AND o.status NOT IN ('cancelled', 'pending_payment')
        LIMIT 1
      `).get(user.id, productId) as { id: number; status: string } | undefined

      if (purchase) {
        canReview = true
      } else {
        // ตรวจสอบว่ามีออเดอร์แต่ยังรอชำระเงินหรือไม่
        const pendingOrder = await db.prepare(`
          SELECT o.id
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.user_id = ?
            AND oi.product_id = ?
            AND o.status = 'pending_payment'
          LIMIT 1
        `).get(user.id, productId)

        if (pendingOrder) {
          purchaseStatusMessage = 'ต้องชำระเงินและสั่งซื้อสำเร็จก่อนจึงจะสามารถรีวิวได้'
        } else {
          purchaseStatusMessage = 'เฉพาะผู้ที่เคยซื้อสินค้านี้เท่านั้นจึงจะสามารถรีวิวได้'
        }
      }
    }
  }

  return {
    reviews,
    summary: {
      total: totalReviews,
      average: Math.round(avgRating * 10) / 10,
      counts: ratingCounts
    },
    userReview,
    canReview,
    purchaseStatusMessage
  }
})
