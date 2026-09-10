export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const body = await readBody(event)
  const { quantity } = body

  if (quantity === undefined || quantity < 1) {
    throw createError({ statusCode: 400, statusMessage: 'จำนวนสินค้าต้องมากกว่า 0' })
  }

  const db = getDb()

  const product = await db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(Number(productId)) as { id: number; name: string; stock: number } | undefined
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบสินค้าชิ้นนี้' })
  }
  if (quantity > product.stock) {
    throw createError({ statusCode: 400, statusMessage: `สินค้า "${product.name}" มีจำนวนคงเหลือไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)` })
  }

  await db.prepare(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?'
  ).run(quantity, user.id, Number(productId))

  return { success: true }
})
