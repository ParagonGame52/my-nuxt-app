export default defineEventHandler(async (event) => {
  const db = getDb()

  // Get actual user count
  const usersResult = await db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const totalUsers = usersResult?.count || 0

  // Get actual gacha rolls count (excluding deleted/cancelled)
  const gachaResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_name LIKE '%[รางวัลสุ่มตู้:%'
      AND COALESCE(o.is_deleted, 0) = 0
      AND o.status NOT IN ('cancelled', 'pending_payment')
  `).get() as { count: number }
  const totalGacha = gachaResult?.count || 0

  // Get real customer review rating from product_reviews table
  const reviewsResult = await db.prepare(`
    SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as avg_rating
    FROM product_reviews
  `).get() as { total_reviews: number; avg_rating: number }

  const totalReviews = Number(reviewsResult?.total_reviews || 0)
  const avgRating = totalReviews > 0
    ? Math.round(Number(reviewsResult.avg_rating) * 10) / 10
    : 5.0

  return {
    totalUsers,
    totalGacha,
    avgRating,
    totalReviews
  }
})
