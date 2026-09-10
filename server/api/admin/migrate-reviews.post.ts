// Admin API — สร้างตาราง product_reviews (รัน 1 ครั้ง)
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const db = getDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id          SERIAL PRIMARY KEY,
      product_id  INTEGER NOT NULL,
      user_id     INTEGER NOT NULL,
      rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title       TEXT DEFAULT '',
      body        TEXT DEFAULT '',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (product_id, user_id)
    )
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews (product_id)
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews (user_id)
  `)

  return { success: true, message: 'สร้างตาราง product_reviews เรียบร้อย' }
})
