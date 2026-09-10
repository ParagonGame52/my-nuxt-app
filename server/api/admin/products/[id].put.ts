export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const body = await readBody(event)
  const { name, price, original_price, status, tag, images, description, details, category = 'STREETWEAR', stock = 10, sizes = [] } = body

  if (!name || !price || !images || !description) {
    throw createError({ statusCode: 400, statusMessage: 'ข้อมูลสินค้าไม่ครบถ้วน' })
  }

  const db = getDb()
  await db.prepare(`
    UPDATE products
    SET name = ?, price = ?, original_price = ?, status = ?, tag = ?, images = ?, description = ?, details = ?, category = ?, stock = ?, sizes = ?
    WHERE id = ?
  `).run(
    name,
    Number(price),
    Number(original_price || price),
    status,
    tag,
    JSON.stringify(images),
    description,
    JSON.stringify(details || []),
    category,
    Number(stock),
    JSON.stringify(sizes || []),
    Number(id)
  )

  return { success: true }
})
