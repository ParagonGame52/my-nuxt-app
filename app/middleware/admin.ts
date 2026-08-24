export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    await auth.fetchMe()
  }
  if (!auth.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!auth.isAdmin) {
    return navigateTo('/')
  }
})
