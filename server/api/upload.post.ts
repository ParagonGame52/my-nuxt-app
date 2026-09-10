import { writeFileSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ' })
  }

  const multipart = await readMultipartFormData(event)
  if (!multipart) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ที่อัปโหลด' })
  }

  const uploadedUrls: string[] = []
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  try {
    mkdirSync(uploadDir, { recursive: true })
  } catch (e) {
    console.error('Failed to create upload directory:', e)
  }

  for (const part of multipart) {
    if (part.filename && part.data) {
      const ext = extname(part.filename).toLowerCase()
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        throw createError({ statusCode: 400, statusMessage: 'รองรับเฉพาะไฟล์รูปภาพเท่านั้น (.png, .jpg, .jpeg, .gif, .webp)' })
      }

      const filename = `${randomUUID()}${ext}`
      const filepath = join(uploadDir, filename)

      try {
        writeFileSync(filepath, part.data)
        uploadedUrls.push(`/uploads/${filename}`)
      } catch (err: any) {
        console.error('Failed to save file:', err)
        throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการบันทึกไฟล์' })
      }
    }
  }

  return { success: true, url: uploadedUrls[0] || '', urls: uploadedUrls }
})
