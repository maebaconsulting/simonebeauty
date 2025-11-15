/**
 * Script de Migration des Images Externes vers Supabase
 *
 * Ce script:
 * 1. Identifie toutes les URLs externes (Unsplash, Pinterest, etc.)
 * 2. Télécharge les images
 * 3. Les uploade sur Supabase avec le bon naming
 * 4. Met à jour la base de données
 *
 * Usage: npx tsx scripts/migrate-external-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationResult {
  productId: number
  productName: string
  oldUrl: string
  newUrl: string | null
  status: 'success' | 'error'
  error?: string
}

const results: MigrationResult[] = []

/**
 * Télécharge une image depuis une URL externe
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    console.log(`📥 Téléchargement: ${url.substring(0, 80)}...`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = await response.buffer()
    console.log(`✅ Téléchargé: ${(buffer.length / 1024).toFixed(2)} KB`)
    return buffer
  } catch (error) {
    console.error(`❌ Erreur téléchargement: ${error}`)
    return null
  }
}

/**
 * Détermine l'extension du fichier depuis l'URL ou le content-type
 */
function getFileExtension(url: string, contentType?: string): string {
  // Essayer depuis l'URL
  const urlMatch = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)
  if (urlMatch) return urlMatch[1].toLowerCase()

  // Essayer depuis le content-type
  if (contentType) {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    }
    return typeMap[contentType] || 'jpg'
  }

  return 'jpg' // Défaut
}

/**
 * Upload une image sur Supabase
 */
async function uploadToSupabase(
  buffer: Buffer,
  bucket: string,
  filePath: string,
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  try {
    console.log(`📤 Upload vers: ${bucket}/${filePath}`)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: false // Ne pas écraser si existe déjà
      })

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log(`⚠️  Fichier existe déjà, on utilise l'existant`)
        return `https://services.simone.paris/storage/v1/object/public/${bucket}/${filePath}`
      }
      throw error
    }

    const newUrl = `https://services.simone.paris/storage/v1/object/public/${bucket}/${filePath}`
    console.log(`✅ Upload réussi: ${newUrl}`)
    return newUrl
  } catch (error) {
    console.error(`❌ Erreur upload: ${error}`)
    return null
  }
}

/**
 * Met à jour l'URL dans la base de données
 */
async function updateProductImageUrl(
  productId: number,
  newUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product')
      .update({ primary_image_url: newUrl })
      .eq('id', productId)

    if (error) throw error

    console.log(`✅ Base de données mise à jour pour produit #${productId}`)
    return true
  } catch (error) {
    console.error(`❌ Erreur mise à jour DB: ${error}`)
    return false
  }
}

/**
 * Migre une image externe
 */
async function migrateExternalImage(
  productId: number,
  productName: string,
  serviceId: number,
  externalUrl: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    productId,
    productName,
    oldUrl: externalUrl,
    newUrl: null,
    status: 'error'
  }

  try {
    // 1. Télécharger l'image
    const buffer = await downloadImage(externalUrl)
    if (!buffer) {
      result.error = 'Échec du téléchargement'
      return result
    }

    // 2. Déterminer le nom du fichier
    const extension = getFileExtension(externalUrl)
    const sanitizedName = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 50)
    const fileName = `${productId}_${sanitizedName}_${Date.now()}.${extension}`
    const filePath = `products/${serviceId}/${fileName}`

    // 3. Uploader sur Supabase
    const newUrl = await uploadToSupabase(buffer, 'product-images', filePath)
    if (!newUrl) {
      result.error = 'Échec de l\'upload'
      return result
    }

    // 4. Mettre à jour la base de données
    const updated = await updateProductImageUrl(productId, newUrl)
    if (!updated) {
      result.error = 'Échec mise à jour DB'
      return result
    }

    result.newUrl = newUrl
    result.status = 'success'
    return result

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Erreur inconnue'
    return result
  }
}

/**
 * Identifie les produits avec URLs externes
 */
async function findProductsWithExternalUrls() {
  const { data: products, error } = await supabase
    .from('product')
    .select('id, name, service_id, primary_image_url')
    .not('primary_image_url', 'is', null)
    .or(
      'primary_image_url.like.%unsplash%,' +
      'primary_image_url.like.%pinimg%,' +
      'primary_image_url.like.%consoglobe%,' +
      'primary_image_url.like.%gstatic%,' +
      'primary_image_url.like.%encrypted-tbn%'
    )

  if (error) {
    console.error('❌ Erreur récupération produits:', error)
    return []
  }

  return products || []
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la migration des images externes\n')

  // 1. Trouver les produits
  console.log('📋 Recherche des produits avec URLs externes...')
  const products = await findProductsWithExternalUrls()

  if (products.length === 0) {
    console.log('✅ Aucun produit avec URL externe trouvé!')
    return
  }

  console.log(`\n📦 ${products.length} produits à migrer\n`)
  console.log('─'.repeat(80))

  // 2. Migrer chaque produit
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    console.log(`\n[${i + 1}/${products.length}] Produit #${product.id} - ${product.name}`)
    console.log('─'.repeat(80))

    const result = await migrateExternalImage(
      product.id,
      product.name,
      product.service_id,
      product.primary_image_url!
    )

    results.push(result)

    // Pause de 500ms entre chaque migration
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // 3. Rapport final
  console.log('\n' + '='.repeat(80))
  console.log('📊 RAPPORT DE MIGRATION')
  console.log('='.repeat(80))

  const successful = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'error').length

  console.log(`\n✅ Succès: ${successful}/${results.length}`)
  console.log(`❌ Échecs: ${failed}/${results.length}`)

  if (failed > 0) {
    console.log('\n❌ Produits en échec:')
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`  - #${r.productId} ${r.productName}: ${r.error}`)
      })
  }

  // 4. Sauvegarder le rapport
  const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 Rapport complet sauvegardé: ${reportPath}`)
}

// Exécution
main()
  .then(() => {
    console.log('\n✨ Migration terminée!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })
