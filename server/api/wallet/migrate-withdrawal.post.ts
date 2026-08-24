export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin !== 1) {
    throw createError({ statusCode: 403, statusMessage: 'เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  await db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL,
      bank_name TEXT,
      bank_account TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  return { success: true, message: 'สร้างตาราง withdrawal_requests สำเร็จ' }
})
