export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    await auth.fetchMe()
  }
  if (auth.isLoggedIn) {
    return navigateTo('/')
  }
})
