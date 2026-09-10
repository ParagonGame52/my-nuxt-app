import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuthStore()
  const cart = useCartStore()
  const toast = useToast()

  const router = useRouter()
  const protectedRoutes = ['/profile', '/admin', '/cart', '/history', '/support']
  const checkAndRedirectIfProtected = () => {
    const currentPath = router.currentRoute.value?.path || (typeof window !== 'undefined' ? window.location.pathname : '')
    if (protectedRoutes.some(p => currentPath.startsWith(p))) {
      navigateTo('/login')
    }
  }

  // 1. Cross-Tab Session Synchronization via BroadcastChannel
  let channel: BroadcastChannel | null = null
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('dip_drip_auth_sync')

    channel.onmessage = async (event) => {
      const { type } = event.data || {}
      if (type === 'LOGIN') {
        await auth.fetchMe()
        if (auth.isLoggedIn) {
          await cart.fetchCart()
          toast.success('เข้าสู่ระบบแล้ว', 'ซิงค์เซสชันจากแท็บอื่นเรียบร้อยแล้ว')
        }
      } else if (type === 'LOGOUT') {
        auth.user = null
        toast.info('ออกจากระบบแล้ว', 'บัญชีของคุณถูกออกจากระบบจากแท็บอื่น')
        checkAndRedirectIfProtected()
      } else if (type === 'BALANCE_REFRESH') {
        await auth.fetchMe()
      }
    }
  }

  // 2. Storage event fallback for cross-tab sync
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', async (e) => {
      if (e.key === 'auth_sync_event') {
        try {
          const data = JSON.parse(e.newValue || '{}')
          if (data.type === 'LOGIN') {
            await auth.fetchMe()
            if (auth.isLoggedIn) await cart.fetchCart()
          } else if (data.type === 'LOGOUT') {
            auth.user = null
            checkAndRedirectIfProtected()
          } else if (data.type === 'BALANCE_REFRESH') {
            await auth.fetchMe()
          }
        } catch {
          // ignore
        }
      }
    })
  }

  // 3. Heartbeat check every 3 minutes
  nuxtApp.hook('app:mounted', () => {
    const interval = setInterval(async () => {
      if (auth.isLoggedIn) {
        const user = await auth.fetchMe()
        if (!user && auth.isLoggedIn) {
          toast.warning('เซสชันหมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
          navigateTo('/login')
        }
      }
    }, 3 * 60 * 1000)

    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
      if (channel) channel.close()
    })
  })
})
