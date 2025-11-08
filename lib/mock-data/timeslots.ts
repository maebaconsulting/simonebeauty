import type { TimeSlot, Contractor } from '@/types/booking'

export const mockContractors: Contractor[] = [
  {
    id: 'contractor-1',
    first_name: 'Marie',
    last_name: 'Dupont',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    rating: 4.9,
    reviews_count: 127,
    specialties: ['Massage', 'Drainage lymphatique'],
  },
  {
    id: 'contractor-2',
    first_name: 'Sophie',
    last_name: 'Martin',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    rating: 4.8,
    reviews_count: 89,
    specialties: ['Coiffure', 'Coloration'],
  },
  {
    id: 'contractor-3',
    first_name: 'Julie',
    last_name: 'Bernard',
    avatar_url: 'https://i.pravatar.cc/150?img=9',
    rating: 5.0,
    reviews_count: 215,
    specialties: ['Beauté des ongles', 'Nail art'],
  },
]

// Generate mock timeslots for the next 7 days
export function generateMockTimeslots(startDate?: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const start = startDate || new Date()
  start.setHours(0, 0, 0, 0)

  const timeRanges = [
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ]

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(start)
    date.setDate(date.getDate() + dayOffset)

    // Skip Sundays
    if (date.getDay() === 0) continue

    timeRanges.forEach((startTime, index) => {
      // Random availability (70% chance)
      const available = Math.random() > 0.3

      // Calculate end time (assume 1 hour slots for simplicity)
      const [hours, minutes] = startTime.split(':').map(Number)
      const endHours = hours + 1
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

      // Random contractor assignment
      const contractor = available
        ? mockContractors[Math.floor(Math.random() * mockContractors.length)]
        : undefined

      slots.push({
        date: date.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        contractor_id: contractor?.id,
        available,
      })
    })
  }

  return slots
}

export const mockTimeslots = generateMockTimeslots()
