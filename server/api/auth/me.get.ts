export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'ไม่ได้เข้าสู่ระบบ' })
  }
  return { user }
})
