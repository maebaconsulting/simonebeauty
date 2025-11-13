/**
 * Google Distance Matrix API Integration
 * Task: T066
 * Feature: 007-contractor-interface
 *
 * Calculates travel time and distance between two locations using Google Distance Matrix API
 */

export interface Location {
  latitude?: number
  longitude?: number
  address?: string
}

export interface DistanceMatrixResult {
  distance_meters: number
  duration_seconds: number
  duration_minutes: number
  origin: string
  destination: string
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_ROUTE_LENGTH_EXCEEDED' | 'ERROR'
}

export interface DistanceMatrixError {
  error: string
  status: string
}

/**
 * Calculate travel time between two locations using Google Distance Matrix API
 *
 * @param origin - Origin location (coordinates or address)
 * @param destination - Destination location (coordinates or address)
 * @param apiKey - Google Maps API key (defaults to env variable)
 * @param mode - Travel mode (driving, walking, bicycling, transit)
 * @returns Travel time and distance information
 */
export async function calculateTravelTime(
  origin: Location,
  destination: Location,
  apiKey?: string,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<DistanceMatrixResult | DistanceMatrixError> {
  try {
    // Get API key from parameter or environment
    const key = apiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!key) {
      return {
        error: 'Google Maps API key not configured',
        status: 'ERROR',
      }
    }

    // Format origin and destination
    const originParam = formatLocation(origin)
    const destinationParam = formatLocation(destination)

    if (!originParam || !destinationParam) {
      return {
        error: 'Invalid origin or destination location',
        status: 'ERROR',
      }
    }

    // Build API URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
    const params = new URLSearchParams({
      origins: originParam,
      destinations: destinationParam,
      mode,
      key,
      units: 'metric',
      departure_time: 'now', // For real-time traffic data
    })

    const url = `${baseUrl}?${params.toString()}`

    // Make API request
    const response = await fetch(url)

    if (!response.ok) {
      return {
        error: `Google Maps API request failed: ${response.statusText}`,
        status: 'ERROR',
      }
    }

    const data = await response.json()

    // Check overall status
    if (data.status !== 'OK') {
      return {
        error: `Google Maps API returned status: ${data.status}`,
        status: data.status || 'ERROR',
      }
    }

    // Extract first result
    const element = data.rows?.[0]?.elements?.[0]

    if (!element) {
      return {
        error: 'No route found',
        status: 'ZERO_RESULTS',
      }
    }

    // Check element status
    if (element.status !== 'OK') {
      return {
        error: `Route calculation failed: ${element.status}`,
        status: element.status,
      }
    }

    // Extract travel time and distance
    const distanceMeters = element.distance?.value || 0
    const durationSeconds = element.duration?.value || 0
    const durationMinutes = Math.ceil(durationSeconds / 60)

    return {
      distance_meters: distanceMeters,
      duration_seconds: durationSeconds,
      duration_minutes: durationMinutes,
      origin: data.origin_addresses?.[0] || originParam,
      destination: data.destination_addresses?.[0] || destinationParam,
      status: 'OK',
    }
  } catch (error) {
    console.error('Error calculating travel time:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'ERROR',
    }
  }
}

/**
 * Format a location object for the Google Distance Matrix API
 */
function formatLocation(location: Location): string | null {
  // Prefer coordinates over address for accuracy
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return `${location.latitude},${location.longitude}`
  }

  // Fall back to address
  if (location.address) {
    return location.address
  }

  return null
}

/**
 * Calculate travel times for a sequence of bookings
 * Updates each booking with travel_time_before (from previous) and travel_time_after (to next)
 *
 * @param bookings - Array of bookings with location information (sorted by date/time)
 * @param apiKey - Google Maps API key
 * @returns Array of bookings with updated travel times
 */
export async function calculateBookingTravelTimes(
  bookings: Array<{
    id: number
    service_address?: string
    service_latitude?: number
    service_longitude?: number
  }>,
  apiKey?: string
): Promise<Array<{ id: number; travel_time_before?: number; travel_time_after?: number }>> {
  const results: Array<{ id: number; travel_time_before?: number; travel_time_after?: number }> = []

  for (let i = 0; i < bookings.length; i++) {
    const current = bookings[i]
    const previous = i > 0 ? bookings[i - 1] : null
    const next = i < bookings.length - 1 ? bookings[i + 1] : null

    const result: { id: number; travel_time_before?: number; travel_time_after?: number } = {
      id: current.id,
    }

    // Calculate travel time from previous booking
    if (previous) {
      const travelTime = await calculateTravelTime(
        {
          latitude: previous.service_latitude,
          longitude: previous.service_longitude,
          address: previous.service_address,
        },
        {
          latitude: current.service_latitude,
          longitude: current.service_longitude,
          address: current.service_address,
        },
        apiKey
      )

      if ('duration_minutes' in travelTime) {
        result.travel_time_before = travelTime.duration_minutes
      }
    }

    // Calculate travel time to next booking
    if (next) {
      const travelTime = await calculateTravelTime(
        {
          latitude: current.service_latitude,
          longitude: current.service_longitude,
          address: current.service_address,
        },
        {
          latitude: next.service_latitude,
          longitude: next.service_longitude,
          address: next.service_address,
        },
        apiKey
      )

      if ('duration_minutes' in travelTime) {
        result.travel_time_after = travelTime.duration_minutes
      }
    }

    results.push(result)
  }

  return results
}
