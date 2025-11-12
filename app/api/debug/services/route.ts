import { NextResponse } from 'next/server'
import { serviceRepository } from '@/lib/repositories/service-repository'

export async function GET() {
  try {
    // Test categories
    const categories = await serviceRepository.getServiceCategories()

    // Test services
    const services = await serviceRepository.getServices({ limit: 5 })

    return NextResponse.json({
      success: true,
      categoriesCount: categories.length,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        count: c.count,
      })),
      servicesCount: services.length,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        subcategory_id: s.subcategory_id,
        price: s.base_price,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
