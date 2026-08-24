export default defineEventHandler(async (event) => {
  const db = getDb()

  // Fetch recent order items (gacha won and direct purchases)
  const rows = await db.prepare(`
    SELECT 
      oi.id,
      oi.product_name,
      oi.product_id,
      oi.product_price,
      o.id as order_id,
      o.status as order_status,
      o.created_at,
      u.name as user_name,
      u.avatar as user_avatar,
      p.images as product_images
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.status NOT IN ('cancelled', 'pending_payment')
    ORDER BY o.created_at DESC, oi.id DESC
    LIMIT 6
  `).all() as any[]

  const fallbackImages = [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=100&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&q=80'
  ]

  const activities = rows.map((r, idx) => {
    let img = fallbackImages[idx % fallbackImages.length]
    if (r.product_images) {
      try {
        const parsed = JSON.parse(r.product_images)
        if (Array.isArray(parsed) && parsed.length > 0) {
          img = parsed[0]
        }
      } catch (e) {}
    }

    const isGacha = r.order_status === 'gacha_won' || (r.product_name || '').includes('[รางวัลสุ่มตู้:')
    let cleanName = (r.product_name || '')
      .replace(/🎁\s*\[รางวัลสุ่มตู้:\s*[^\]]+\]\s*/g, '')
      .replace(/\[รางวัลสุ่มตู้:\s*[^\]]+\]\s*/g, '')
      .trim()
    if (!cleanName) cleanName = 'สินค้าแฟชั่นนำเข้า'

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
