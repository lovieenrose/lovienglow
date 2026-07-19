// Resets all test data back to a clean baseline: wipes POS sales /
// incoming-stock purchase orders / stock adjustments, and restores every
// product's stock_quantity / reorder_level to its original seed value.
//
// One-time setup required first: run supabase/reset_test_data_function.sql
// in the Supabase SQL editor (creates the `reset_test_data` RPC this script
// calls).
//
// Usage: npm run test:reset

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

const OWNER_EMAIL = 'lovin.glow.ph@gmail.com'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Original seed values from the initial 47-product import, keyed by SKU.
const SEED_STOCK = {
  BLBP: { stock_quantity: 2, reorder_level: 5 },
  DS05: { stock_quantity: 4, reorder_level: 5 },
  CU50: { stock_quantity: 6, reorder_level: 5 },
  'GLU-1200MG': { stock_quantity: 0, reorder_level: 5 },
  GT15: { stock_quantity: 2, reorder_level: 5 },
  KV10: { stock_quantity: 4, reorder_level: 5 },
  RT10: { stock_quantity: 0, reorder_level: 5 },
  RT20: { stock_quantity: 9, reorder_level: 5 },
  TR15: { stock_quantity: 11, reorder_level: 5 },
  TR30: { stock_quantity: 7, reorder_level: 5 },
  GHKH: { stock_quantity: 5, reorder_level: 5 },
  SPDR: { stock_quantity: 5, reorder_level: 5 },
  SPHY: { stock_quantity: 5, reorder_level: 5 },
  SRCC: { stock_quantity: 5, reorder_level: 5 },
  SWAS: { stock_quantity: 5, reorder_level: 5 },
  'CAP-10ML-PNK-PC': { stock_quantity: 4, reorder_level: 5 },
  'PAD-CHX-ALC-PC': { stock_quantity: 444, reorder_level: 5 },
  'CASE-PP-8555-PC': { stock_quantity: 13, reorder_level: 5 },
  'MAT-DSP-PNK-PC': { stock_quantity: 13, reorder_level: 5 },
  'GLV-ORX-PNK-M-PC': { stock_quantity: 86, reorder_level: 3 },
  'CRD-SYR3-LL-2310-PC': { stock_quantity: 94, reorder_level: 10 },
  'SG-29G-13MM-PC': { stock_quantity: 64, reorder_level: 25 },
  'CAP-3ML-PNK-PC': { stock_quantity: 6, reorder_level: 5 },
  TPGK: { stock_quantity: 4, reorder_level: 5 },
  TPRN: { stock_quantity: 1, reorder_level: 5 },
  NP08: { stock_quantity: 3, reorder_level: 5 },
  AA05: { stock_quantity: 3, reorder_level: 5 },
  BA10: { stock_quantity: 12, reorder_level: 5 },
  BA03: { stock_quantity: 8, reorder_level: 5 },
  BA05: { stock_quantity: 4, reorder_level: 5 },
  'PBW-AMP-10ML': { stock_quantity: 8, reorder_level: 5 },
  'PBW-VIAL-10ML': { stock_quantity: 0, reorder_level: 5 },
  'SAL-100ML': { stock_quantity: 0, reorder_level: 5 },
  'SAL-15ML': { stock_quantity: 0, reorder_level: 5 },
  'SAL-500ML': { stock_quantity: 0, reorder_level: 5 },
  'SWI-AMP-5ML': { stock_quantity: 0, reorder_level: 5 },
}

async function findOwnerId(email) {
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found.id
    if (data.users.length < 200) return null
    page += 1
  }
}

async function main() {
  const ownerId = await findOwnerId(OWNER_EMAIL)
  if (!ownerId) {
    console.error(`No auth user found for ${OWNER_EMAIL}.`)
    process.exit(1)
  }

  const { error: rpcError } = await supabase.rpc('reset_test_data', { p_owner_id: ownerId })
  if (rpcError) {
    console.error('reset_test_data RPC failed:', rpcError.message)
    console.error('Have you run supabase/reset_test_data_function.sql in the Supabase SQL editor yet?')
    process.exit(1)
  }
  console.log('Orders, sales, purchase orders, and stock adjustments cleared. Sequences restarted.')

  let updated = 0
  for (const [sku, values] of Object.entries(SEED_STOCK)) {
    const { error } = await supabase
      .from('products')
      .update(values)
      .eq('owner_id', ownerId)
      .eq('sku', sku)
    if (error) throw error
    updated += 1
  }
  console.log(`Reset stock/reorder levels for ${updated} products.`)
  console.log('Done — test environment is back to baseline.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
