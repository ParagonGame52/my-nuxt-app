import { unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่ได้ระบุชื่อไฟล์ที่ต้องการลบ' })
  }

  // Security sanitize: only allow alphanumeric, dash, underscore, dot
  const sanitized = filename.replace(/[^a-zA-Z0-9.\-_]/g, '')
  if (!sanitized || sanitized.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'ชื่อไฟล์ไม่ถูกต้อง' })
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const filePath = join(uploadDir, sanitized)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบไฟล์ดังกล่าวในระบบ' })
  }

  try {
    unlinkSync(filePath)
    return { success: true, message: 'ลบไฟล์รูปภาพเรียบร้อยแล้ว' }
  } catch (err: any) {
    console.error('Failed to delete file:', err)
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการลบไฟล์' })
  }
})
