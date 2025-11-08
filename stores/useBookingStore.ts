import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BookingSession,
  Service,
  Address,
  TimeSlot,
  Contractor,
} from '@/types/booking'

interface BookingStore extends BookingSession {
  // Actions
  setService: (service: Service) => void
  setAddress: (address: Address) => void
  setTimeslot: (timeslot: TimeSlot, contractor?: Contractor) => void
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
  canProceed: () => boolean
}

const initialState: BookingSession = {
  current_step: 1,
  service: undefined,
  address: undefined,
  timeslot: undefined,
  contractor: undefined,
  additional_services: [],
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setService: (service) => {
        set({ service, current_step: 2 })
      },

      setAddress: (address) => {
        set({ address, current_step: 3 })
      },

      setTimeslot: (timeslot, contractor) => {
        set({ timeslot, contractor, current_step: 4 })
      },

      setCurrentStep: (step) => {
        set({ current_step: step })
      },

      nextStep: () => {
        const { current_step } = get()
        if (current_step < 4) {
          set({ current_step: (current_step + 1) as 1 | 2 | 3 | 4 })
        }
      },

      previousStep: () => {
        const { current_step } = get()
        if (current_step > 1) {
          set({ current_step: (current_step - 1) as 1 | 2 | 3 | 4 })
        }
      },

      reset: () => {
        set(initialState)
      },

      canProceed: () => {
        const { current_step, service, address, timeslot } = get()

        switch (current_step) {
          case 1:
            return !!service
          case 2:
            return !!address
          case 3:
            return !!timeslot
          case 4:
            return true // Confirmation step
          default:
            return false
        }
      },
    }),
    {
      name: 'booking-session',
      partialize: (state) => ({
        service: state.service,
        address: state.address,
        timeslot: state.timeslot,
        contractor: state.contractor,
        current_step: state.current_step,
      }),
    }
  )
)
