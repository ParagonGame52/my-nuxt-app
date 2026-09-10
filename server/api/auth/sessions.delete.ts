export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบ' })
  }

  const currentToken = getCookie(event, 'session_token')
  const body = await readBody(event).catch(() => ({}))
  const sessionId = body?.sessionId

  const db = getDb()

  if (sessionId) {
    // Revoke specific session (except current)
    await db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ? AND token != ?').run(Number(sessionId), user.id, currentToken)
    return { success: true, message: 'ยกเลิกเซสชันเรียบร้อยแล้ว' }
  } else {
    // Revoke all OTHER sessions
    await db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(user.id, currentToken)
    return { success: true, message: 'ออกจากระบบอุปกรณ์อื่นทั้งหมดเรียบร้อยแล้ว' }
  }
})
