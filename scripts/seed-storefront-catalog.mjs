// One-time (idempotent) seed: attaches storefront_meta to the 30 real
// products that map 1:1 to the old static storefront catalog, and creates
// 8 product_sets bundles for the "GLP-1 Complete/Duo Set" categories.
// Safe to re-run — upserts by SKU / set name.
//
// Usage: node scripts/seed-storefront-catalog.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] ??= match[2].split('#')[0].trim()
}

const OWNER_ID = 'ea319e69-8643-463d-84dd-01661ca0bb5a'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const singlePeptideBenefits = ['Vial-only format', 'Clearly labeled', 'Easy to add to a custom order']
const skinboosterBenefits = ['5 ml bottle', 'Glow-focused option', 'Easy to pair with a routine']
const topicalBenefits = ['Topical format', 'Clearly labeled', 'Compact size']
const supplyBenefits = ['Single piece', 'Preparation supply', 'Easy add-on']
const waterBenefits = ['Clearly labeled', 'Compact format', 'Easy add-on']

// SKU -> storefront_meta for the 30 directly-mapped products.
const PRODUCT_META = {
  DS05: { slug: 'dsip-5mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Single vial format, vial only.', rating: 4.7, reviews: 41, strength: ['5 mg'], benefits: singlePeptideBenefits, palette: ['#efb8c8', '#8e3857', '#fff5f8'], form: 'vial' },
  CU50: { slug: 'ghk-cu-50mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Single GHK-Cu vial, vial only.', rating: 4.8, reviews: 52, strength: ['50 mg'], benefits: singlePeptideBenefits, palette: ['#c2d7ef', '#355c86', '#f3f8ff'], form: 'vial' },
  KV10: { slug: 'kpv-10mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Single KPV vial, vial only.', rating: 4.7, reviews: 37, strength: ['10 mg'], benefits: singlePeptideBenefits, palette: ['#f4c3ce', '#9a3851', '#fff2f5'], form: 'vial' },
  GT15: { slug: 'fuan-glutathione-1500mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'FUAN Glutathione 1500 mg, vial only.', rating: 4.8, reviews: 46, isNew: true, strength: ['1500 mg'], benefits: singlePeptideBenefits, palette: ['#d6e3c5', '#50723c', '#f8fff0'], form: 'vial' },
  'GLU-1200MG': { slug: 'korean-glutaone-1200mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'KOREAN Glutaone 1200 mg, vial only.', rating: 4.7, reviews: 44, strength: ['1200 mg'], benefits: singlePeptideBenefits, palette: ['#f0d6a8', '#836020', '#fff9ec'], form: 'vial' },
  TR15: { slug: 'tirzepatide-15mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Tirzepatide 15 mg, vial only.', rating: 4.8, reviews: 72, isBestSeller: true, strength: ['15 mg'], benefits: singlePeptideBenefits, palette: ['#f2c6bc', '#894331', '#fff7f3'], form: 'vial' },
  TR30: { slug: 'tirzepatide-30mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Tirzepatide 30 mg, vial only.', rating: 4.9, reviews: 81, isBestSeller: true, strength: ['30 mg'], benefits: singlePeptideBenefits, palette: ['#f6ced7', '#8e3150', '#fff5f8'], form: 'vial' },
  RT10: { slug: 'retatrutide-10mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Retatrutide 10 mg, vial only.', rating: 4.8, reviews: 59, strength: ['10 mg'], benefits: singlePeptideBenefits, palette: ['#ded2ef', '#5d4a81', '#fbf8ff'], form: 'vial' },
  RT20: { slug: 'retatrutide-20mg', category: 'Single Peptides', shortCategory: 'Single peptide', shortDescription: 'Retatrutide 20 mg, vial only.', rating: 4.9, reviews: 61, isBestSeller: true, strength: ['20 mg'], benefits: singlePeptideBenefits, palette: ['#c7e6dc', '#2d7664', '#f2fffb'], form: 'vial' },

  SPHY: { slug: 'pink-hya-5ml', category: 'Skinboosters', shortCategory: 'Skinbooster', shortDescription: 'Pink HYA skinbooster, 5 ml.', rating: 4.8, reviews: 48, isBestSeller: true, strength: ['5 ml'], benefits: skinboosterBenefits, palette: ['#f4c3ce', '#9a3851', '#fff2f5'], form: 'bottle' },
  GHKH: { slug: 'ghk-cu-hya-5ml', category: 'Skinboosters', shortCategory: 'Skinbooster', shortDescription: 'GHK-Cu HYA skinbooster, 5 ml.', rating: 4.8, reviews: 43, strength: ['5 ml'], benefits: skinboosterBenefits, palette: ['#b9ddea', '#2f7389', '#f2fbff'], form: 'bottle' },
  SPDR: { slug: 'pdrn-5ml', category: 'Skinboosters', shortCategory: 'Skinbooster', shortDescription: 'PDRN skinbooster, 5 ml.', rating: 4.8, reviews: 40, strength: ['5 ml'], benefits: skinboosterBenefits, palette: ['#eadbd2', '#806458', '#fffaf6'], form: 'bottle' },
  SRCC: { slug: 'recombinant-collagen-5ml', category: 'Skinboosters', shortCategory: 'Skinbooster', shortDescription: 'Recombinant Collagen skinbooster, 5 ml.', rating: 4.7, reviews: 36, strength: ['5 ml'], benefits: skinboosterBenefits, palette: ['#f0d6a8', '#836020', '#fff9ec'], form: 'bottle' },
  SWAS: { slug: 'whitening-spot-fading-5ml', category: 'Skinboosters', shortCategory: 'Skinbooster', shortDescription: 'Whitening and Spot Fading skinbooster, 5 ml.', rating: 4.7, reviews: 35, strength: ['5 ml'], benefits: skinboosterBenefits, palette: ['#d6e3c5', '#50723c', '#f8fff0'], form: 'bottle' },

  BLBP: { slug: 'lemon-bottle-plus-10ml', category: 'Liquid Blends', shortCategory: 'Liquid blend', shortDescription: 'Liquid blend format, 10 ml.', rating: 4.8, reviews: 39, isNew: true, strength: ['10 ml'], benefits: ['10 ml bottle', 'Liquid blend format', 'Easy to add to a custom order'], palette: ['#f1df8e', '#786c1f', '#fffbe3'], form: 'bottle' },

  TPGK: { slug: 'ghk-cu-1g-topical', category: 'Topicals', shortCategory: 'Topical', shortDescription: 'Topical format, 1 g.', rating: 4.8, reviews: 45, isBestSeller: true, strength: ['1 g'], benefits: topicalBenefits, palette: ['#c2d7ef', '#355c86', '#f3f8ff'], form: 'jar' },
  TPRN: { slug: 'pdrn-salmon-dna-1g', category: 'Topicals', shortCategory: 'Topical', shortDescription: 'PDRN Salmon DNA topical, 1 g.', rating: 4.8, reviews: 42, strength: ['1 g'], benefits: topicalBenefits, palette: ['#f2c6bc', '#894331', '#fff7f3'], form: 'jar' },
  NP08: { slug: 'snap-8-10mg', category: 'Topicals', shortCategory: 'Topical', shortDescription: 'Snap-8 topical format, 10 mg.', rating: 4.7, reviews: 32, strength: ['10 mg'], benefits: topicalBenefits, palette: ['#ded2ef', '#5d4a81', '#fbf8ff'], form: 'jar' },

  'CRD-SYR3-LL-2310-PC': { slug: 'recon-syringe-crd-3ml-23g-1-inch', category: 'Other Supplies', shortCategory: 'Supply', shortDescription: 'Recon syringe, 1 pc.', rating: 4.8, reviews: 58, strength: ['1 pc'], benefits: supplyBenefits, palette: ['#f0aaa7', '#8c3f44', '#fff4f2'], form: 'supply' },
  'SG-29G-13MM-PC': { slug: 'sg-insulin-syringe-29g-13mm', category: 'Other Supplies', shortCategory: 'Supply', shortDescription: 'Insulin syringe, 1 pc.', rating: 4.8, reviews: 61, strength: ['1 pc'], benefits: supplyBenefits, palette: ['#b9ddea', '#2f7389', '#f2fbff'], form: 'supply' },

  AA05: { slug: 'acetic-acid-water-5ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Water format, 5 ml.', rating: 4.8, reviews: 54, strength: ['5 ml'], benefits: waterBenefits, palette: ['#c7e6dc', '#2d7664', '#f2fffb'], form: 'vial' },
  BA03: { slug: 'bac-water-3ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Bacteriostatic water, 3 ml.', rating: 4.9, reviews: 73, strength: ['3 ml'], benefits: waterBenefits, palette: ['#b9ddea', '#2f7389', '#f2fbff'], form: 'vial' },
  BA05: { slug: 'bac-water-5ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Bacteriostatic water, 5 ml.', rating: 4.9, reviews: 71, strength: ['5 ml'], benefits: waterBenefits, palette: ['#c2d7ef', '#355c86', '#f3f8ff'], form: 'vial' },
  BA10: { slug: 'bac-water-10ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Bacteriostatic water, 10 ml.', rating: 4.9, reviews: 75, isBestSeller: true, strength: ['10 ml'], benefits: waterBenefits, palette: ['#d6e3c5', '#50723c', '#f8fff0'], form: 'vial' },
  'PBW-AMP-10ML': { slug: 'pharma-bac-water-ampoule-10ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Pharma bac water ampoule, 10 ml.', rating: 4.8, reviews: 57, strength: ['10 ml'], benefits: waterBenefits, palette: ['#eadbd2', '#806458', '#fffaf6'], form: 'vial' },
  'PBW-VIAL-10ML': { slug: 'pharma-bac-water-vial-10ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Pharma bac water vial, 10 ml.', rating: 4.8, reviews: 59, strength: ['10 ml'], benefits: waterBenefits, palette: ['#f2c6bc', '#894331', '#fff7f3'], form: 'vial' },
  'SAL-15ML': { slug: 'saline-water-15ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Saline water, 15 ml.', rating: 4.8, reviews: 63, strength: ['15 ml'], benefits: waterBenefits, palette: ['#c7e6dc', '#2d7664', '#f2fffb'], form: 'vial' },
  'SAL-100ML': { slug: 'saline-water-100ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Saline water, 100 ml.', rating: 4.8, reviews: 52, strength: ['100 ml'], benefits: waterBenefits, palette: ['#b9ddea', '#2f7389', '#f2fbff'], form: 'bottle' },
  'SAL-500ML': { slug: 'saline-water-500ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Saline water, 500 ml.', rating: 4.8, reviews: 49, strength: ['500 ml'], benefits: waterBenefits, palette: ['#c2d7ef', '#355c86', '#f3f8ff'], form: 'bottle' },
  'SWI-AMP-5ML': { slug: 'sterile-water-for-inj-ampoule-5ml', category: 'Waters', shortCategory: 'Water', shortDescription: 'Sterile water ampoule, 5 ml.', rating: 4.8, reviews: 66, strength: ['5 ml'], benefits: waterBenefits, palette: ['#eadbd2', '#806458', '#fffaf6'], form: 'vial' },
}

const completeSetBenefits = ['Complete coordinated set', 'Includes bac water', 'Includes essentials']
const essentials = [
  { sku: 'PAD-CHX-ALC-PC', quantity: 1 },
  { sku: 'CRD-SYR3-LL-2310-PC', quantity: 1 },
]

// Fixed bundle prices per the official pricelist. GLP-1 Duo Set was removed
// entirely — only the Complete Set category remains.
// Complete sets: TR15 ₱1499, TR30 ₱1799, RT10 ₱1499, RT20 ₱1899
const SETS = [
  { name: 'Tirzepatide 15 mg Set', slug: 'tirzepatide-15mg-complete-set', category: 'GLP-1 Complete Set', shortCategory: 'Complete set', shortDescription: 'Tirzepatide 15 mg with 3 ml bac water and essentials.', rating: 4.9, reviews: 128, isBestSeller: true, strength: ['15 mg'], benefits: completeSetBenefits, palette: ['#f3a9be', '#8c2847', '#fff4f7'], sortOrder: 1, fixedPrice: 1499, items: [{ sku: 'TR15', quantity: 1 }, { sku: 'BA03', quantity: 1 }, ...essentials] },
  { name: 'Tirzepatide 30 mg Set', slug: 'tirzepatide-30mg-complete-set', category: 'GLP-1 Complete Set', shortCategory: 'Complete set', shortDescription: 'Tirzepatide 30 mg with 5 ml bac water and essentials.', rating: 4.9, reviews: 112, isBestSeller: true, strength: ['30 mg'], benefits: completeSetBenefits, palette: ['#e8b9d6', '#6f315f', '#fff7fc'], sortOrder: 2, fixedPrice: 1799, items: [{ sku: 'TR30', quantity: 1 }, { sku: 'BA05', quantity: 1 }, ...essentials] },
  { name: 'Retatrutide 10 mg Set', slug: 'retatrutide-10mg-complete-set', category: 'GLP-1 Complete Set', shortCategory: 'Complete set', shortDescription: 'Retatrutide 10 mg with 3 ml bac water and essentials.', rating: 4.8, reviews: 89, isNew: true, strength: ['10 mg'], benefits: completeSetBenefits, palette: ['#f2b7a8', '#a24a3b', '#fff5ef'], sortOrder: 3, fixedPrice: 1499, items: [{ sku: 'RT10', quantity: 1 }, { sku: 'BA03', quantity: 1 }, ...essentials] },
  { name: 'Retatrutide 20 mg Set', slug: 'retatrutide-20mg-complete-set', category: 'GLP-1 Complete Set', shortCategory: 'Complete set', shortDescription: 'Retatrutide 20 mg with 3 ml bac water and essentials.', rating: 4.9, reviews: 77, isBestSeller: true, strength: ['20 mg'], benefits: completeSetBenefits, palette: ['#d9c4e8', '#6c4a81', '#fbf7ff'], sortOrder: 4, fixedPrice: 1899, items: [{ sku: 'RT20', quantity: 1 }, { sku: 'BA03', quantity: 1 }, ...essentials] },
]

async function main() {
  let updated = 0
  for (const [sku, meta] of Object.entries(PRODUCT_META)) {
    const { form, ...rest } = meta
    const { error, count } = await supabase
      .from('products')
      .update({ storefront_meta: { ...rest, form } }, { count: 'exact' })
      .eq('owner_id', OWNER_ID)
      .eq('sku', sku)
    if (error) throw error
    if (!count) console.warn(`  ! No product found for SKU ${sku} — skipped`)
    else updated += 1
  }
  console.log(`storefront_meta set on ${updated}/${Object.keys(PRODUCT_META).length} products.`)

  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('id, sku')
    .eq('owner_id', OWNER_ID)
  if (productsError) throw productsError
  const productIdBySku = new Map(allProducts.map((p) => [p.sku, p.id]))

  let setsCreated = 0
  let setsUpdated = 0
  for (const set of SETS) {
    const { name, slug, category, shortCategory, shortDescription, rating, reviews, isNew, isBestSeller, strength, benefits, palette, sortOrder, fixedPrice, items } = set
    const storefront_meta = { slug, category, shortCategory, shortDescription, rating, reviews, isNew, isBestSeller, strength, benefits, palette, form: 'set', fixedPrice }

    const { data: existing } = await supabase
      .from('product_sets')
      .select('id')
      .eq('owner_id', OWNER_ID)
      .eq('name', name)
      .maybeSingle()

    let setId = existing?.id
    if (setId) {
      const { error } = await supabase.from('product_sets').update({ storefront_meta, sort_order: sortOrder }).eq('id', setId)
      if (error) throw error
      setsUpdated += 1
    } else {
      const { data: created, error } = await supabase
        .from('product_sets')
        .insert({ owner_id: OWNER_ID, name, storefront_meta, sort_order: sortOrder, icon: 'Package', color: palette[0] })
        .select('id')
        .single()
      if (error) throw error
      setId = created.id
      setsCreated += 1
    }

    await supabase.from('product_set_items').delete().eq('product_set_id', setId).eq('owner_id', OWNER_ID)
    const itemRows = items
      .map((item) => ({ owner_id: OWNER_ID, product_set_id: setId, product_id: productIdBySku.get(item.sku), quantity: item.quantity }))
      .filter((row) => row.product_id)
    if (itemRows.length !== items.length) {
      console.warn(`  ! Set "${name}": some component SKUs not found, only ${itemRows.length}/${items.length} items linked`)
    }
    const { error: itemsError } = await supabase.from('product_set_items').insert(itemRows)
    if (itemsError) throw itemsError
  }
  console.log(`Product sets: ${setsCreated} created, ${setsUpdated} updated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
