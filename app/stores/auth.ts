import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  name: string
  email: string
  balance: number
  is_admin: number
  shipping_name?: string
  shipping_phone?: string
  shipping_address?: string
  avatar?: string
  points?: number
  total_spent?: number
  tier?: string
}

function broadcastSession(type: 'LOGIN' | 'LOGOUT' | 'BALANCE_REFRESH') {
  if (typeof window !== 'undefined') {
    try {
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('dip_drip_auth_sync')
        ch.postMessage({ type, timestamp: Date.now() })
        setTimeout(() => ch.close(), 100)
      }
      localStorage.setItem('auth_sync_event', JSON.stringify({ type, timestamp: Date.now() }))
    } catch {
      // ignore
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const sessionToken = useCookie<string | null>('session_token', {
    maxAge: 7 * 24 * 60 * 60,
    sameSite: 'lax',
    path: '/'
  })

  const isLoggedIn = computed(() => !!user.value)
  const balance = computed(() => user.value ? user.value.balance : 0)
  const isAdmin = computed(() => user.value ? user.value.is_admin >= 1 : false)
  const isSuperAdmin = computed(() => user.value ? user.value.is_admin >= 2 : false)
  const adminRoleLabel = computed(() => {
    if (!user.value) return ''
    if (user.value.is_admin >= 2) return 'แอดมินสูงสุด (Super Admin)'
    if (user.value.is_admin === 1) return 'แอดมินทั่วไป (Staff Admin)'
    return 'สมาชิกทั่วไป'
  })

  const hasCompletedAddress = computed(() => {
    if (!user.value) return false
    const sName = user.value.shipping_name?.trim()
    const sPhone = user.value.shipping_phone?.trim()
    const sAddr = user.value.shipping_address?.trim()

    if (!sName || !sPhone || !sAddr) return false

    try {
      const parsed = JSON.parse(sAddr)
      if (!parsed.province || !parsed.district || !parsed.subdistrict || !parsed.houseDetails) {
        return false
      }
    } catch {
      if (sAddr.length < 5) return false
    }
    return true
  })

  async function fetchMe() {
    loading.value = true
    try {
      const fetch = useRequestFetch()
      const data = await fetch<{ user: User }>('/api/auth/me')
      user.value = data.user
      return data.user
    } catch {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data = await $fetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = data.user
      broadcastSession('LOGIN')
      return data.user
    } finally {
      loading.value = false
    }
  }

  async function register(name: string, email: string, password: string) {
    loading.value = true
    try {
      const data = await $fetch<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      })
      user.value = data.user
      broadcastSession('LOGIN')
      return data.user
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    } finally {
      user.value = null
      sessionToken.value = null
      broadcastSession('LOGOUT')
    }
  }

  async function requestTopUp(amount: number, slip_url: string) {
    if (!isLoggedIn.value) return
    const data = await $fetch<{ success: boolean }>('/api/wallet/request-topup', {
      method: 'POST',
      body: { amount, slip_url }
    })
    broadcastSession('BALANCE_REFRESH')
    return data
  }

  async function toggleAdmin() {
    if (!isLoggedIn.value) return
    const data = await $fetch<{ success: boolean; is_admin: number }>('/api/auth/toggle-admin', {
      method: 'POST'
    })
    if (data.success && user.value) {
      user.value.is_admin = data.is_admin
      broadcastSession('LOGIN')
    }
  }

  
  async function deleteAccount(password: string) {
    loading.value = true
    try {
      const data = await $fetch<{ success: boolean; message: string }>('/api/auth/delete-account', {
        method: 'POST',
        body: { password }
      })
      user.value = null
      sessionToken.value = null
      broadcastSession('LOGOUT')
      return data
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    isLoggedIn,
    balance,
    isAdmin,
    isSuperAdmin,
    adminRoleLabel,
    hasCompletedAddress,
    fetchMe,
    login,
    register,
    logout,
    requestTopUp,
    toggleAdmin,
    deleteAccount
  }
})
