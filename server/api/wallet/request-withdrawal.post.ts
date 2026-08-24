export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { amount, bank_name, bank_account } = body

  if (!amount || Number(amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'จำนวนเงินไม่ถูกต้อง' })
  }
  if (!bank_name || !bank_account) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อธนาคารและเลขบัญชี' })
  }

  const db = getDb()

  // ตรวจสอบ balance เพียงพอ
  const currentUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(user.id) as { balance: number }
  if (Number(currentUser.balance) < Number(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'ยอดเงินในกระเป๋าไม่เพียงพอ' })
  }

  const executeWithdrawal = db.transaction(async () => {
    // หักเงินทันที (hold)
    await db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(Number(amount), user.id)

    // สร้าง withdrawal request
    await db.prepare(`
      INSERT INTO withdrawal_requests (user_id, amount, bank_name, bank_account, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(user.id, Number(amount), bank_name, bank_account)
  })

  await executeWithdrawal()

  const updatedUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(user.id) as { balance: number }
  return { success: true, balance: updatedUser.balance }
})
