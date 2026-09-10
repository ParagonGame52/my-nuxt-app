export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const requestedPoints = Number(body?.points || 0)

  if (requestedPoints < 100) {
    throw createError({ statusCode: 400, statusMessage: 'ต้องแลกอย่างน้อย 100 แต้ม' })
  }

  const db = getDb()
  const dbUser = await db.prepare('SELECT points, balance FROM users WHERE id = ?').get(user.id) as { points: number; balance: number }

  const currentPoints = Number(dbUser?.points || 0)
  if (currentPoints < requestedPoints) {
    throw createError({ statusCode: 400, statusMessage: `แต้มสะสมไม่เพียงพอ (คุณมี ${currentPoints} แต้ม)` })
  }

  // Calculate redeemable units (100 points = 10 THB)
  const redeemUnits = Math.floor(requestedPoints / 100)
  const pointsToDeduct = redeemUnits * 100
  const bonusBalance = redeemUnits * 10

  const newPoints = currentPoints - pointsToDeduct
  const newBalance = Number(dbUser.balance || 0) + bonusBalance

  await db.prepare('UPDATE users SET points = ?, balance = ? WHERE id = ?').run(newPoints, newBalance, user.id)

  return {
    success: true,
    pointsDeducted: pointsToDeduct,
    bonusBalance,
    newPoints,
    newBalance
  }
})
