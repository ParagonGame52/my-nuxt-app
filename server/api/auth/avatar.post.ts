import { writeFileSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

// POST /api/auth/avatar — user อัปโหลดรูปโปรไฟล์ของตัวเอง
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const multipart = await readMultipartFormData(event)
  if (!multipart || multipart.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ที่อัปโหลด' })
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
  try { mkdirSync(uploadDir, { recursive: true }) } catch {}

  const part = multipart.find(p => p.filename && p.data)
  if (!part) throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์รูปภาพ' })

  const ext = extname(part.filename!).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'รองรับเฉพาะไฟล์รูปภาพ (.png, .jpg, .jpeg, .gif, .webp)' })
  }

  const filename = `avatar_${user.id}_${randomUUID()}${ext}`
  const filepath = join(uploadDir, filename)
  writeFileSync(filepath, part.data)

  const avatarUrl = `/uploads/avatars/${filename}`

  // บันทึก URL ลง database
  const db = getDb()
  await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, user.id)

  return { success: true, url: avatarUrl }
})
