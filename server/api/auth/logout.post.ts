export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  if (token) {
    const db = getDb()
    await db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }

  deleteCookie(event, 'session_token', { path: '/' })
  return { success: true }
})
