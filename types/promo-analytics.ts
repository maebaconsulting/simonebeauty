/**
 * Promo Analytics Types
 * Feature: 015-promo-codes-system
 *
 * Types for promo code analytics and reporting
 */

// Overall analytics KPIs
export interface PromoAnalyticsKPIs {
  total_active_codes: number
  total_uses: number
  total_platform_cost: number  // Sum of all discount_amount (platform absorbs this)
  total_revenue_with_promos: number  // Sum of final_amount (what clients paid)
  roi_percentage: number  // (revenue - cost) / cost * 100
}

// Top performing promo code
export interface TopPromoCode {
  code: string
  promo_code_id: number
  uses_count: number
  total_platform_cost: number
  average_discount: number
  total_revenue: number  // Sum of final_amount
  conversion_rate: number  // uses / views (if tracked)
}

// Usage over time (for charts)
export interface PromoUsageChartData {
  date: string  // ISO date (YYYY-MM-DD)
  uses_count: number
  total_discount: number
  total_revenue: number
}

// Individual promo code performance
export interface PromoCodePerformance {
  promo_code_id: number
  code: string
  description: string | null

  // Usage stats
  total_uses: number
  unique_users: number

  // Financial stats
  total_platform_cost: number
  average_discount: number
  total_revenue: number

  // Temporal stats
  usage_by_day: PromoUsageChartData[]
  most_active_day: string | null

  // User breakdown
  top_users: Array<{
    user_id: string
    user_email: string
    uses_count: number
    total_discount: number
  }>
}

// Filters for analytics
export interface AnalyticsDateRange {
  start_date: string  // ISO date
  end_date: string    // ISO date
}

// Export data for CSV
export interface PromoUsageExportRow {
  date: string
  code: string
  user_email: string
  user_id: string
  booking_id: number
  service_name: string
  original_amount: number
  discount_amount: number
  final_amount: number
}
