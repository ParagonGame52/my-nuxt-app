import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useSession() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const isAdmin = computed(() => authStore.isAdmin)
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const adminRoleLabel = computed(() => authStore.adminRoleLabel)
  const balance = computed(() => authStore.balance)
  const status = computed(() => {
    if (authStore.loading) return 'loading'
    return authStore.isLoggedIn ? 'authenticated' : 'unauthenticated'
  })

  async function refresh() {
    return await authStore.fetchMe()
  }

  async function signOut(redirect = '/login') {
    await authStore.logout()
    if (redirect) {
      navigateTo(redirect)
    }
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    adminRoleLabel,
    balance,
    status,
    refresh,
    signOut,
  }
}
