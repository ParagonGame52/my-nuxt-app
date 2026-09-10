// Public API — ดึงโปรโมชั่นที่ active และอยู่ในช่วงเวลาปัจจุบัน (รองรับเวลาเป็นนาที/วินาที)
export default defineEventHandler(async () => {
  const db = getDb()
  const allPromos = await db.prepare(`
    SELECT * FROM promotions
    WHERE is_active = 1
    ORDER BY end_date ASC, created_at DESC
  `).all() as any[]

  const now = new Date()

  const activePromos = allPromos.filter(p => {
    if (p.start_date) {
      const start = new Date(p.start_date)
      if (start.getTime() > now.getTime()) return false
    }
    if (p.end_date) {
      const end = new Date(p.end_date)
      // ถ้าเป็นรูปแบบวันที่อย่างเดียว (ไม่มีเวลา) ให้หมดอายุตอนสิ้นวัน 23:59:59
      if (typeof p.end_date === 'string' && p.end_date.length === 10) {
        end.setHours(23, 59, 59, 999)
      }
      if (end.getTime() < now.getTime()) return false
    }
    return true
  })

  return { promotions: activePromos }
})
