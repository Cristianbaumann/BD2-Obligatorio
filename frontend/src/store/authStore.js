import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      rol: null,

      login(token, userData) {
        const payload = decodeJWT(token)
        const rol = payload?.rol || payload?.role || userData?.rol || null
        set({ token, user: userData || payload, rol })
      },

      logout() {
        set({ token: null, user: null, rol: null })
      },

      isAuthenticated() {
        const { token } = useAuthStore.getState()
        if (!token) return false
        const payload = decodeJWT(token)
        if (!payload?.exp) return true
        return payload.exp * 1000 > Date.now()
      },
    }),
    {
      name: 'mundial-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user, rol: state.rol }),
    }
  )
)

export default useAuthStore
