export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { product_id, product_name, product_price, product_img, quantity = 1 } = body

  if (!product_id || !product_name || !product_price || !product_img) {
    throw createError({ statusCode: 400, statusMessage: 'ข้อมูลสินค้าไม่ครบถ้วน' })
  }

  const db = getDb()

  // Check product stock & size stock
  const product = await db.prepare('SELECT id, name, stock, sizes FROM products WHERE id = ?').get(product_id) as any
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบสินค้าชิ้นนี้' })
  }

  let availableStock = Number(product.stock || 0)
  const match = (product_name || '').match(/\(([^)]+)\)$/)
  const sizeName = match ? match[1].trim().toUpperCase() : null

  if (sizeName) {
    try {
      const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
      if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
        const found = parsedSizes.find((s: any) => String(typeof s === 'object' ? s.name || s.size : s).toUpperCase() === sizeName)
        if (found && typeof found === 'object' && found.stock !== undefined) {
          availableStock = Number(found.stock)
        }
      }
    } catch {}
  }

  if (availableStock <= 0) {
    throw createError({ statusCode: 400, statusMessage: `สินค้า "${product_name}" หมดแล้ว` })
  }

  // Upsert: matching user_id, product_id, and product_name
  const existing = await db.prepare(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND product_name = ?'
  ).get(user.id, product_id, product_name) as { id: number; quantity: number } | undefined

  const totalRequested = (existing?.quantity || 0) + quantity
  if (totalRequested > availableStock) {
    throw createError({ statusCode: 400, statusMessage: `สินค้า "${product_name}" มีจำนวนคงเหลือไม่เพียงพอ (คงเหลือ ${availableStock} ชิ้น)` })
  }

  if (existing) {
    await db.prepare(
      'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
    ).run(quantity, existing.id)
  } else {
    await db.prepare(`
      INSERT INTO cart_items (user_id, product_id, product_name, product_price, product_img, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, product_id, product_name, product_price, product_img, quantity)
  }

  return { success: true }
})
