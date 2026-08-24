export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)

  const body = await readBody(event)
  const { id } = event.context.params as { id: string }
  const targetId = Number(id)
  const { name, email, balance, is_admin, tier, points } = body

  if (!name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและอีเมล' })
  }

  const db = getDb()

  const existing = await db.prepare('SELECT id, is_admin FROM users WHERE email = ? AND id != ?').get(email, targetId)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'อีเมลนี้ถูกใช้งานแล้ว' })
  }

  const targetUser = await db.prepare('SELECT id, is_admin, tier, points FROM users WHERE id = ?').get(targetId) as any
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบบัญชีผู้ใช้นี้' })
  }

  // Regular admin cannot change role or edit super admin
  let newAdminRole = targetUser.is_admin
  if (adminUser.is_super_admin) {
    newAdminRole = Number(is_admin ?? targetUser.is_admin)
  } else if (is_admin !== undefined && Number(is_admin) !== targetUser.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'เฉพาะแอดมินสูงสุด (Super Admin) เท่านั้นที่สามารถปรับเปลี่ยนสิทธิ์แอดมินได้' })
  }

  // Regular admin cannot change tier
  let newTier = targetUser.tier || 'bronze'
  if (adminUser.is_super_admin) {
    newTier = tier ? String(tier).toLowerCase() : (targetUser.tier || 'bronze')
  } else if (tier !== undefined && String(tier).toLowerCase() !== (targetUser.tier || 'bronze').toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: 'เฉพาะแอดมินสูงสุด (Super Admin) เท่านั้นที่สามารถปรับระดับสมาชิก (Tier) ได้' })
  }

  // Regular admin cannot edit Super Admin accounts
  if (!adminUser.is_super_admin && targetUser.is_admin >= 2) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์แก้ไขบัญชีแอดมินสูงสุด' })
  }

  const newPoints = points !== undefined ? Number(points) : Number(targetUser.points || 0)

  if (body.newPassword && body.newPassword.length >= 6) {
    const hash = hashPassword(body.newPassword)
    await db.prepare('UPDATE users SET name = ?, email = ?, balance = ?, is_admin = ?, tier = ?, points = ?, password_hash = ? WHERE id = ?')
      .run(name, email, Number(balance), newAdminRole, newTier, newPoints, hash, targetId)
  } else {
    await db.prepare('UPDATE users SET name = ?, email = ?, balance = ?, is_admin = ?, tier = ?, points = ? WHERE id = ?')
      .run(name, email, Number(balance), newAdminRole, newTier, newPoints, targetId)
  }

  return { success: true, message: 'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว' }
})
