export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { chest_id } = body

  if (!chest_id) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสตู้สุ่มที่ต้องการสุ่ม' })
  }

  const db = getDb()

  // 1. Get chest details
  const chest = await db.prepare('SELECT * FROM gacha_chests WHERE id = ? AND is_active = 1').get(Number(chest_id)) as any
  if (!chest) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบตู้สุ่มนี้ หรือตู้สุ่มยังไม่เปิดใช้งาน' })
  }

  // 2. Get current user balance
  const dbUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(user.id) as { balance: number }
  if (dbUser.balance < chest.price) {
    throw createError({ statusCode: 400, statusMessage: `ยอดเงินไม่เพียงพอ กรุณาเติมเงินก่อนสุ่ม (ค่าสุ่มตู้สุ่มนี้คือ ${chest.price} บาท)` })
  }

  // 3. Get all items in the chest pool with available stock
  const items = await db.prepare(`
    SELECT id, name, image, price, tier, odds, product_id, stock
    FROM gacha_chest_items
    WHERE chest_id = ? AND (stock IS NULL OR stock > 0)
  `).all(Number(chest_id)) as any[]

  if (items.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'ตู้สุ่มนี้หมดสินค้าแล้ว หรือยังไม่มีของรางวัลเปิดให้สุ่ม' })
  }

  // 4. Select an item using weighted random (odds)
  const totalWeight = items.reduce((sum, item) => sum + (item.odds || 100), 0)
  let random = Math.floor(Math.random() * totalWeight)
  let winner = items[0]

  for (const item of items) {
    random -= (item.odds || 100)
    if (random < 0) {
      winner = item
      break
    }
  }

  const winningImg = winner.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80'

  // 5. Use transaction to roll gacha
  const executeRoll = db.transaction(async () => {
    // Deduct user balance
    await db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(chest.price, user.id)

    // Deduct stock if limited
    if (winner.stock !== null && winner.stock !== undefined) {
      await db.prepare('UPDATE gacha_chest_items SET stock = stock - 1 WHERE id = ? AND (stock IS NULL OR stock > 0)').run(winner.id)
    }

    // Create order with pending status
    const orderResult = await db.prepare(`
      INSERT INTO orders (user_id, total_price, status, payment_method, shipping_name, shipping_phone, shipping_address)
      VALUES (?, ?, 'pending', 'wallet', ?, ?, ?)
    `).run(user.id, chest.price, user.shipping_name || user.name, user.shipping_phone || '', user.shipping_address || '')

    const orderId = orderResult.lastInsertRowid as number

    // Create order item with actual winning prize image
    await db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, product_img)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(orderId, winner.product_id || winner.id, `[รางวัลสุ่มตู้: ${chest.name}] ${winner.name || 'ของรางวัล'}`, chest.price, winningImg)

    return orderId
  })

  try {
    const orderId = await executeRoll()
    const newBalance = dbUser.balance - chest.price

    return {
      success: true,
      newBalance,
      orderId,
      product: {
        id: winner.id,
        name: winner.name || 'ของรางวัล',
        price: winner.price || chest.price,
        img: winningImg
      }
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: 'การสุ่มล้มเหลว: ' + error.message })
  }
})
