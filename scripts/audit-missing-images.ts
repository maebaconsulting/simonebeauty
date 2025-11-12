/**
 * Audit des Images Manquantes
 *
 * Génère un rapport détaillé des produits et services sans images
 * pour prioriser les uploads
 *
 * Usage: npx tsx scripts/audit-missing-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProductAudit {
  id: number
  name: string
  service_id: number
  service_name: string
  visible: boolean
  primary_image_url: string | null
  secondary_images_count: number
  has_any_image: boolean
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface ServiceAudit {
  id: number
  name: string
  visible: boolean
  order: number
  web_icone_url: string | null
  web_big_image: string | null
  mobile_icon_url: string | null
  missing_count: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface AuditReport {
  generated_at: string
  summary: {
    total_products: number
    products_without_primary_image: number
    products_without_any_image: number
    visible_products_without_image: number
    total_services: number
    services_with_incomplete_images: number
    visible_services_with_incomplete_images: number
  }
  products_missing_images: ProductAudit[]
  services_missing_images: ServiceAudit[]
  recommendations: string[]
}

/**
 * Audit des produits
 */
async function auditProducts(): Promise<ProductAudit[]> {
  console.log('📦 Audit des produits...')

  const { data: products, error } = await supabase
    .from('product')
    .select(`
      id,
      name,
      service_id,
      visible,
      primary_image_url,
      secondary_image_url,
      services (
        name
      )
    `)
    .order('service_id')
    .order('name')

  if (error) {
    console.error('❌ Erreur:', error)
    return []
  }

  const audits: ProductAudit[] = products.map((p: any) => {
    const hasSecondary = p.secondary_image_url && p.secondary_image_url.length > 0
    const hasAny = !!p.primary_image_url || hasSecondary

    // Priorité basée sur visibilité et popularité
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    if (p.visible && !p.primary_image_url) {
      priority = 'HIGH' // Visible sans image = priorité haute
    } else if (p.visible && !hasAny) {
      priority = 'HIGH' // Visible sans aucune image
    } else if (!p.visible && !p.primary_image_url) {
      priority = 'MEDIUM' // Non visible mais pourrait le devenir
    }

    return {
      id: p.id,
      name: p.name,
      service_id: p.service_id,
      service_name: p.services?.name || 'Unknown',
      visible: p.visible,
      primary_image_url: p.primary_image_url,
      secondary_images_count: p.secondary_image_url?.length || 0,
      has_any_image: hasAny,
      priority
    }
  })

  return audits
}

/**
 * Audit des services
 */
async function auditServices(): Promise<ServiceAudit[]> {
  console.log('🏷️  Audit des services...')

  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .order('order')

  if (error) {
    console.error('❌ Erreur:', error)
    return []
  }

  const audits: ServiceAudit[] = services.map((s: any) => {
    const missingCount =
      (!s.web_icone_url ? 1 : 0) +
      (!s.web_big_image ? 1 : 0) +
      (!s.mobile_icon_url ? 1 : 0)

    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    if (s.visible && missingCount > 0) {
      priority = missingCount >= 2 ? 'HIGH' : 'MEDIUM'
    }

    return {
      id: s.id,
      name: s.name,
      visible: s.visible,
      order: s.order || 999,
      web_icone_url: s.web_icone_url,
      web_big_image: s.web_big_image,
      mobile_icon_url: s.mobile_icon_url,
      missing_count: missingCount,
      priority
    }
  })

  return audits
}

/**
 * Génère des recommandations
 */
function generateRecommendations(
  products: ProductAudit[],
  services: ServiceAudit[]
): string[] {
  const recommendations: string[] = []

  // Services visibles sans images
  const criticalServices = services.filter(s => s.visible && s.missing_count > 0)
  if (criticalServices.length > 0) {
    recommendations.push(
      `🚨 URGENT: ${criticalServices.length} services visibles manquent d'images. ` +
      `Affecte directement l'expérience utilisateur sur la page d'accueil.`
    )
  }

  // Produits visibles sans image principale
  const criticalProducts = products.filter(p => p.visible && !p.primary_image_url)
  if (criticalProducts.length > 0) {
    recommendations.push(
      `⚠️  IMPORTANT: ${criticalProducts.length} produits visibles sans image principale. ` +
      `Les utilisateurs verront des placeholders.`
    )
  }

  // Produits sans aucune image (même secondaire)
  const productsWithoutAny = products.filter(p => p.visible && !p.has_any_image)
  if (productsWithoutAny.length > 0) {
    recommendations.push(
      `❌ CRITIQUE: ${productsWithoutAny.length} produits visibles sans AUCUNE image. ` +
      `Expérience utilisateur fortement dégradée.`
    )
  }

  // Services triés par ordre d'affichage
  const topServices = services
    .filter(s => s.visible && s.missing_count > 0)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)

  if (topServices.length > 0) {
    recommendations.push(
      `📍 Prioriser les services en top de liste: ${topServices.map(s => s.name).join(', ')}`
    )
  }

  // Analyse par catégorie
  const productsByService = products
    .filter(p => p.visible && !p.primary_image_url)
    .reduce((acc, p) => {
      acc[p.service_name] = (acc[p.service_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topCategories = Object.entries(productsByService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  if (topCategories.length > 0) {
    recommendations.push(
      `📊 Catégories les plus affectées: ` +
      topCategories.map(([name, count]) => `${name} (${count} produits)`).join(', ')
    )
  }

  return recommendations
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Audit des Images - Simone Paris\n')

  // 1. Audit
  const products = await auditProducts()
  const services = await auditServices()

  // 2. Calculs statistiques
  const summary = {
    total_products: products.length,
    products_without_primary_image: products.filter(p => !p.primary_image_url).length,
    products_without_any_image: products.filter(p => !p.has_any_image).length,
    visible_products_without_image: products.filter(p => p.visible && !p.primary_image_url).length,
    total_services: services.length,
    services_with_incomplete_images: services.filter(s => s.missing_count > 0).length,
    visible_services_with_incomplete_images: services.filter(s => s.visible && s.missing_count > 0).length
  }

  // 3. Recommandations
  const recommendations = generateRecommendations(products, services)

  // 4. Rapport complet
  const report: AuditReport = {
    generated_at: new Date().toISOString(),
    summary,
    products_missing_images: products.filter(p => !p.primary_image_url || !p.has_any_image),
    services_missing_images: services.filter(s => s.missing_count > 0),
    recommendations
  }

  // 5. Affichage console
  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉSUMÉ DE L\'AUDIT')
  console.log('='.repeat(80))
  console.log(`\n📦 Produits:`)
  console.log(`  Total: ${summary.total_products}`)
  console.log(`  Sans image principale: ${summary.products_without_primary_image} (${((summary.products_without_primary_image / summary.total_products) * 100).toFixed(1)}%)`)
  console.log(`  Sans AUCUNE image: ${summary.products_without_any_image}`)
  console.log(`  ⚠️  Visibles sans image: ${summary.visible_products_without_image}`)

  console.log(`\n🏷️  Services:`)
  console.log(`  Total: ${summary.total_services}`)
  console.log(`  Avec images incomplètes: ${summary.services_with_incomplete_images}`)
  console.log(`  ⚠️  Visibles avec images manquantes: ${summary.visible_services_with_incomplete_images}`)

  console.log('\n' + '='.repeat(80))
  console.log('💡 RECOMMANDATIONS')
  console.log('='.repeat(80))
  recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec}`)
  })

  // 6. Sauvegarder le rapport JSON
  const reportPath = path.join(__dirname, `../docs/audit-images-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n\n📄 Rapport JSON complet: ${reportPath}`)

  // 7. Sauvegarder un CSV pour Excel
  const csvPath = path.join(__dirname, `../docs/produits-sans-images-${Date.now()}.csv`)
  const csvLines = [
    'ID,Nom,Service,Visible,Image Principale,Images Secondaires,Priorité',
    ...report.products_missing_images
      .filter(p => p.priority === 'HIGH')
      .map(p =>
        `${p.id},"${p.name}","${p.service_name}",${p.visible ? 'Oui' : 'Non'},${p.primary_image_url ? 'Oui' : 'Non'},${p.secondary_images_count},${p.priority}`
      )
  ]
  fs.writeFileSync(csvPath, csvLines.join('\n'))
  console.log(`📊 Rapport CSV (priorité HIGH): ${csvPath}`)
}

// Exécution
main()
  .then(() => {
    console.log('\n✨ Audit terminé!\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Erreur:', error)
    process.exit(1)
  })
