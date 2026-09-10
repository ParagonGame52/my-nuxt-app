export default defineEventHandler(async (event) => {
  const db = getDb()

  // Fetch recent order items (gacha won and direct purchases)
  const rows = await db.prepare(`
    SELECT 
      oi.id,
      oi.product_name,
      oi.product_id,
      oi.product_price,
      oi.product_img,
      o.id as order_id,
      o.status as order_status,
      o.created_at,
      u.name as user_name,
      u.avatar as user_avatar,
      p.images as product_images,
      gci.image as gacha_image
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN gacha_chest_items gci ON gci.id = oi.product_id
    WHERE COALESCE(o.is_deleted, 0) = 0
      AND o.status NOT IN ('cancelled', 'pending_payment')
    ORDER BY o.created_at DESC, oi.id DESC
    LIMIT 6
  `).all() as any[]

  const activities = rows.map((r) => {
    // 1. Check order item product_img
    let img = (r.product_img || '').trim()

    // 2. Check gacha prize image if not found
    if (!img && r.gacha_image) {
      img = String(r.gacha_image).trim()
    }

    // 3. Check product images array if not found
    if (!img && r.product_images) {
      try {
        const parsed = JSON.parse(r.product_images)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          img = String(parsed[0]).trim()
        }
      } catch (e) {}
    }

    const isGacha = r.order_status === 'gacha_won' || (r.product_name || '').includes('[รางวัลสุ่มตู้:')
    let cleanName = (r.product_name || '')
      .replace(/🎁\s*\[รางวัลสุ่มตู้:\s*[^\]]+\]\s*/g, '')
      .replace(/\[รางวัลสุ่มตู้:\s*[^\]]+\]\s*/g, '')
      .trim()
    if (!cleanName) cleanName = 'สินค้า'

    const uName = r.user_name ? `${r.user_name}` : 'ลูกค้า'
    const actionText = isGacha ? `สุ่มได้ ${cleanName}` : `ซื้อ ${cleanName}`

    return {
      id: r.id,
      text: actionText,
      userName: uName,
      img,
      isGacha,
      created_at: r.created_at
    }
  })

  return { activities }
})
