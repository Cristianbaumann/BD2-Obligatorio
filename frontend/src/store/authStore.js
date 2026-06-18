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
      estado_verificacion: null,

      login(token, userData) {
        const payload = decodeJWT(token)
        const rol = payload?.["https://mundial-auth/rol"] || userData?.role || null
        set({ token, user: userData || payload, rol, estado_verificacion: userData?.estado_verificacion || null })
      },

      setVerificado() {
        set({ estado_verificacion: 'VERIFICADO' })
      },

      logout() {
        set({ token: null, user: null, rol: null, estado_verificacion: null })
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
      partialize: (state) => ({ token: state.token, user: state.user, rol: state.rol, estado_verificacion: state.estado_verificacion }),
    }
  )
)

export default useAuthStore
