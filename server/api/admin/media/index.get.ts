import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface MediaItem {
  id: string
  url: string
  name: string
  source: 'uploaded' | 'products' | 'promotions' | 'gacha' | 'presets'
  size?: number
  createdAt?: string
}

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const items: MediaItem[] = []
  const seenUrls = new Set<string>()

  // 1. Scan public/uploads directory
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  try {
    const files = readdirSync(uploadDir, { withFileTypes: true })
    for (const file of files) {
      if (file.isFile()) {
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
          const filePath = join(uploadDir, file.name)
          let size = 0
          let createdAt = new Date().toISOString()
          try {
            const stat = statSync(filePath)
            size = stat.size
            createdAt = stat.mtime.toISOString()
          } catch {}

          const url = `/uploads/${file.name}`
          seenUrls.add(url)
          items.push({
            id: `upload-${file.name}`,
            url,
            name: file.name,
            source: 'uploaded',
            size,
            createdAt
          })
        }
      } else if (file.isDirectory() && file.name === 'avatars') {
        try {
          const avatarDir = join(uploadDir, 'avatars')
          const avatarFiles = readdirSync(avatarDir, { withFileTypes: true })
          for (const avFile of avatarFiles) {
            if (avFile.isFile()) {
              const url = `/uploads/avatars/${avFile.name}`
              if (!seenUrls.has(url)) {
                seenUrls.add(url)
                items.push({
                  id: `upload-avatar-${avFile.name}`,
                  url,
                  name: `avatar: ${avFile.name}`,
                  source: 'uploaded'
                })
              }
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Failed to read uploads directory:', err)
  }

  // 2. Query products from DB
  try {
    const products = await db.prepare('SELECT id, name, images FROM products ORDER BY id DESC').all() as any[]
    for (const prod of products) {
      if (!prod.images) continue
      let imgList: string[] = []
      if (typeof prod.images === 'string') {
        try {
          const parsed = JSON.parse(prod.images)
          if (Array.isArray(parsed)) imgList = parsed
          else imgList = [prod.images]
        } catch {
          imgList = prod.images.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
      } else if (Array.isArray(prod.images)) {
        imgList = prod.images
      }

      for (let i = 0; i < imgList.length; i++) {
        const url = imgList[i]
        if (url && typeof url === 'string' && !seenUrls.has(url)) {
          seenUrls.add(url)
          items.push({
            id: `prod-${prod.id}-${i}`,
            url,
            name: `${prod.name || 'สินค้า'} (${i + 1})`,
            source: 'products'
          })
        }
      }
    }
  } catch (err) {
    console.error('Failed to load products images:', err)
  }

  // 3. Query promotions from DB
  try {
    const promotions = await db.prepare('SELECT id, title, image FROM promotions ORDER BY id DESC').all() as any[]
    for (const promo of promotions) {
      if (promo.image && !seenUrls.has(promo.image)) {
        seenUrls.add(promo.image)
        items.push({
          id: `promo-${promo.id}`,
          url: promo.image,
          name: promo.title || 'โปรโมชั่น',
          source: 'promotions'
        })
      }
    }
  } catch (err) {
    console.error('Failed to load promotions images:', err)
  }

  // 4. Query gacha chests & items from DB
  try {
    const chests = await db.prepare('SELECT id, name, image FROM gacha_chests ORDER BY id DESC').all() as any[]
    for (const chest of chests) {
      if (chest.image && !seenUrls.has(chest.image)) {
        seenUrls.add(chest.image)
        items.push({
          id: `gacha-chest-${chest.id}`,
          url: chest.image,
          name: `ตู้สุ่ม: ${chest.name || 'ตู้สุ่ม'}`,
          source: 'gacha'
        })
      }
    }

    const chestItems = await db.prepare('SELECT id, name, image FROM gacha_chest_items ORDER BY id DESC').all() as any[]
    for (const item of chestItems) {
      if (item.image && !seenUrls.has(item.image)) {
        seenUrls.add(item.image)
        items.push({
          id: `gacha-item-${item.id}`,
          url: item.image,
          name: `ของรางวัล: ${item.name || 'ไอเทม'}`,
          source: 'gacha'
        })
      }
    }
  } catch (err) {
    console.error('Failed to load gacha images:', err)
  }

  // 5. High-quality Curated Presets / Templates
  const presets: Array<{ name: string; url: string }> = [
    { name: '🔥 Flash Sale Banner', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80' },
    { name: '🛍️ Special Promotion Banner', url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80' },
    { name: '⚡ Limited Collection Banner', url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80' },
    { name: '🎁 Gift & Rewards Banner', url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80' },
    { name: '🚚 Free Shipping Banner', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80' },
    { name: '👕 Streetwear Oversized Tee Black', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80' },
    { name: '🧥 Streetwear Hoodie Vintage', url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80' },
    { name: '👟 Sneaker Limited Edition', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80' },
    { name: '🧢 Street Cap Aesthetic', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80' },
    { name: '🕶️ Sunglasses Luxury Street', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80' },
    { name: '📦 Mystery Box Gold Rare', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80' },
    { name: '✨ Neon Cyber Mystery Chest', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' }
  ]

  for (let i = 0; i < presets.length; i++) {
    const p = presets[i]!
    if (!seenUrls.has(p.url)) {
      seenUrls.add(p.url)
      items.push({
        id: `preset-${i}`,
        url: p.url,
        name: p.name,
        source: 'presets'
      })
    }
  }

  return {
    success: true,
    total: items.length,
    items
  }
})
