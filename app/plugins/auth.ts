import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  const cart = useCartStore()
  
  await auth.fetchMe()
  if (auth.isLoggedIn) {
    await cart.fetchCart()
  }
})
