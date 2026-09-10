export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { payment_method = 'wallet', slip_image = null, shipping_name, shipping_phone, shipping_address } = body || {}

  if (!shipping_name || !shipping_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุชื่อผู้รับสินค้า' })
  }
  if (!shipping_phone || !shipping_phone.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุเบอร์โทรศัพท์ผู้รับ' })
  }
  if (!shipping_address || !shipping_address.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุที่อยู่จัดส่งสินค้า' })
  }

  const db = getDb()

  // Get current user balance & membership data
  const dbUser = await db.prepare('SELECT balance, total_spent, points, tier FROM users WHERE id = ?').get(user.id) as { balance: number; total_spent: number; points: number; tier: string }

  // Get cart items to checkout
  const cartItems = await db.prepare(`
    SELECT product_id, product_name, product_price, product_img, quantity
    FROM cart_items WHERE user_id = ?
  `).all(user.id) as { product_id: number; product_name: string; product_price: number; product_img: string; quantity: number }[]

  if (cartItems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่มีสินค้าในตะกร้าสำหรับสั่งซื้อ' })
  }

  const activePromos = await getActivePromotions(db)

  // Validate stock and recalculate with active promotions
  const processedItems: { product_id: number; product_name: string; product_price: number; product_img: string; quantity: number }[] = []
  for (const item of cartItems) {
    const p = await db.prepare('SELECT stock, name, price, category, images FROM products WHERE id = ?').get(item.product_id) as { stock: number; name: string; price: number; category: string; images: string } | undefined
    if (!p) {
      throw createError({ statusCode: 400, statusMessage: `ไม่พบสินค้า "${item.product_name}"` })
    }
    if (p.stock < item.quantity) {
      throw createError({ statusCode: 400, statusMessage: `สินค้า "${p.name}" มีจำนวนคงเหลือไม่เพียงพอ (คงเหลือ ${p.stock} ชิ้น)` })
    }

    let itemImg = item.product_img
    if (!itemImg && p.images) {
      try {
        const imgs = JSON.parse(p.images)
        if (Array.isArray(imgs) && imgs.length > 0) itemImg = imgs[0]
      } catch {}
    }

    const promoCalc = applyBestPromotion(Number(p.price || item.product_price), activePromos, p.category)
    processedItems.push({
      ...item,
      product_img: itemImg || '',
      product_price: promoCalc.finalPrice
    })
  }

  // Calculate subtotal
  const subtotal = processedItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
  
  // Calculate Tier Discount (Platinum 15%, Gold 10%, Silver 5%)
  const userTier = dbUser.tier || 'bronze'
  const tierDiscountRate = getTierDiscount(userTier)
  const tierDiscountAmount = Math.round(subtotal * tierDiscountRate)
  const discountedSubtotal = Math.max(0, subtotal - tierDiscountAmount)

  // Calculate Shipping fee with promotions
  const shippingCalc = calculateShippingFee(discountedSubtotal, activePromos, 50)
  const totalPrice = discountedSubtotal + shippingCalc.finalShippingFee

  if (payment_method === 'wallet') {
    // --- WALLET PAYMENT ---
    if (dbUser.balance < totalPrice) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: `ยอดเงินของคุณไม่เพียงพอ ยอดสุทธิ ฿${totalPrice.toLocaleString()} (ค่าสินค้า ฿${subtotal.toLocaleString()}${tierDiscountAmount > 0 ? ` - ส่วนลดสมาชิก ${userTier.toUpperCase()} ฿${tierDiscountAmount.toLocaleString()}` : ''} + ค่าจัดส่ง ฿${shippingCalc.finalShippingFee}) แต่ยอดคงเหลือในกระเป๋าของคุณคือ ฿${Number(dbUser.balance).toLocaleString()}` 
      })
    }

    const executeCheckout = db.transaction(async () => {
      const currentSpent = Number(dbUser.total_spent || 0) + totalPrice
      const currentTier = dbUser.tier || 'bronze'
      const earnedPoints = calculateEarnedPoints(totalPrice, currentTier)
      const newTotalPoints = Number(dbUser.points || 0) + earnedPoints
      const newTier = calculateTier(currentSpent)

      await db.prepare('UPDATE users SET balance = balance - ?, total_spent = ?, points = ?, tier = ? WHERE id = ?')
        .run(totalPrice, currentSpent, newTotalPoints, newTier, user.id)

      const orderResult = await db.prepare(`
        INSERT INTO orders (user_id, total_price, status, payment_method, shipping_name, shipping_phone, shipping_address, subtotal_price, shipping_cost, shipping_discount, tier_discount, tier_name)
        VALUES (?, ?, 'pending', 'wallet', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, totalPrice, shipping_name, shipping_phone, shipping_address, subtotal, shippingCalc.baseShippingFee, shippingCalc.shippingDiscount, tierDiscountAmount, userTier)

      const orderId = orderResult.lastInsertRowid as number

      const insertItem = await db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, product_img)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      for (const item of processedItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.product_price, item.quantity, item.product_img || '')
        // Deduct stock for product and specific size
        const p = await db.prepare('SELECT id, stock, sizes FROM products WHERE id = ?').get(item.product_id) as any
        if (p) {
          let updatedSizes = p.sizes
          try {
            const parsedSizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes
            if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
              const match = (item.product_name || '').match(/\(([^)]+)\)$/)
              const sizeName = match?.[1] ? match[1].trim().toUpperCase() : null
              if (sizeName) {
                const found = parsedSizes.find((s: any) => String(typeof s === 'object' ? s.name || s.size : s).toUpperCase() === sizeName)
                if (found && typeof found === 'object' && found.stock !== undefined) {
                  found.stock = Math.max(0, Number(found.stock) - item.quantity)
                  updatedSizes = JSON.stringify(parsedSizes)
                }
              }
            }
          } catch {}
          await db.prepare('UPDATE products SET stock = GREATEST(0, stock - ?), sizes = ? WHERE id = ?').run(item.quantity, updatedSizes, item.product_id)
        }
      }

      await db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id)
      return { orderId, earnedPoints, newTier }
    })

    try {
      const { orderId, earnedPoints, newTier } = await executeCheckout()
      const newBalance = dbUser.balance - totalPrice
      return { 
        success: true, 
        orderId, 
        newBalance, 
        earnedPoints, 
        newTier, 
        payment_method: 'wallet', 
        subtotal, 
        tierDiscount: tierDiscountAmount,
        shippingCost: shippingCalc.finalShippingFee,
        totalPrice
      }
    } catch (error: any) {
      throw createError({ statusCode: 500, statusMessage: 'การสั่งซื้อล้มเหลว: ' + error.message })
    }

  } else if (payment_method === 'qr') {
    // --- QR PAYMENT ---
    if (!slip_image) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาอัปโหลดสลิปการโอนเงินก่อนยืนยัน' })
    }

    const executeQROrder = db.transaction(async () => {
      const orderResult = await db.prepare(`
        INSERT INTO orders (user_id, total_price, status, payment_method, slip_image, shipping_name, shipping_phone, shipping_address, subtotal_price, shipping_cost, shipping_discount, tier_discount, tier_name)
        VALUES (?, ?, 'pending_payment', 'qr', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, totalPrice, slip_image, shipping_name, shipping_phone, shipping_address, subtotal, shippingCalc.baseShippingFee, shippingCalc.shippingDiscount, tierDiscountAmount, userTier)

      const orderId = orderResult.lastInsertRowid as number

      const insertItem = await db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, product_img)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      for (const item of processedItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.product_price, item.quantity, item.product_img || '')
        const p = await db.prepare('SELECT id, stock, sizes FROM products WHERE id = ?').get(item.product_id) as any
        if (p) {
          let updatedSizes = p.sizes
          try {
            const parsedSizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes
            if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
              const match = (item.product_name || '').match(/\(([^)]+)\)$/)
              const sizeName = match?.[1] ? match[1].trim().toUpperCase() : null
              if (sizeName) {
                const found = parsedSizes.find((s: any) => String(typeof s === 'object' ? s.name || s.size : s).toUpperCase() === sizeName)
                if (found && typeof found === 'object' && found.stock !== undefined) {
                  found.stock = Math.max(0, Number(found.stock) - item.quantity)
                  updatedSizes = JSON.stringify(parsedSizes)
                }
              }
            }
          } catch {}
          await db.prepare('UPDATE products SET stock = GREATEST(0, stock - ?), sizes = ? WHERE id = ?').run(item.quantity, updatedSizes, item.product_id)
        }
      }

      await db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id)
      return orderId
    })

    try {
      const orderId = await executeQROrder()
      return { 
        success: true, 
        orderId, 
        newBalance: dbUser.balance, 
        payment_method: 'qr', 
        subtotal, 
        tierDiscount: tierDiscountAmount,
        shippingCost: shippingCalc.finalShippingFee,
        totalPrice
      }
    } catch (error: any) {
      throw createError({ statusCode: 500, statusMessage: 'การสั่งซื้อล้มเหลว: ' + error.message })
    }

  } else {
    throw createError({ statusCode: 400, statusMessage: 'วิธีชำระเงินไม่ถูกต้อง' })
  }
})
