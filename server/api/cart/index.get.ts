export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const db = getDb()
  const rows = await db.prepare(`
    SELECT c.id, c.product_id, c.product_name, c.product_price, c.product_img, c.quantity,
           p.sizes, COALESCE(p.stock, 0) AS product_stock
    FROM cart_items c
    LEFT JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(user.id) as any[]

  const items = rows.map(r => {
    let sizeStock = Number(r.product_stock || 0)
    try {
      const parsedSizes = typeof r.sizes === 'string' ? JSON.parse(r.sizes) : r.sizes
      if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
        const match = (r.product_name || '').match(/\(([^)]+)\)$/)
        const sizeName = match ? match[1].trim().toUpperCase() : null
        if (sizeName) {
          const found = parsedSizes.find((s: any) => {
            const sName = String(typeof s === 'object' ? s.name || s.size : s).toUpperCase()
            return sName === sizeName
          })
          if (found && typeof found === 'object' && found.stock !== undefined) {
            sizeStock = Number(found.stock)
          }
        }
      }
    } catch {}

    return {
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      product_price: r.product_price,
      product_img: r.product_img,
      quantity: r.quantity,
      stock_quantity: sizeStock
    }
  })

  return { items }
})

