import { create } from 'zustand'

const useEventosStore = create((set) => ({
  eventos: [],
  setEventos: (eventos) => set({ eventos }),
}))

export default useEventosStore
