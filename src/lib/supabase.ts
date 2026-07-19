import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const RECEIPTS_BUCKET = 'receipts'

// No generated Database types for this project, so the client is treated as
// untyped (`any`) here — the table shapes are enforced by the row types in
// orders.ts instead.
let cached: SupabaseClient<any, any, any> | null = null

export function getSupabaseAdmin(): SupabaseClient<any, any, any> {
  if (cached) return cached
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

let bucketEnsured = false

export async function ensureReceiptsBucket() {
  if (bucketEnsured) return
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.storage.getBucket(RECEIPTS_BUCKET)
  if (!data) {
    await supabase.storage.createBucket(RECEIPTS_BUCKET, { public: true })
  }
  bucketEnsured = true
}

export async function uploadReceipt(filename: string, contentType: string, bytes: Uint8Array) {
  await ensureReceiptsBucket()
  const supabase = getSupabaseAdmin()
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Sales/POS payment-proof uploads reuse the same public "receipts" bucket.
export async function uploadPaymentProof(filename: string, contentType: string, bytes: Uint8Array) {
  return uploadReceipt(filename, contentType, bytes)
}

const LOGOS_BUCKET = 'logos'
let logosBucketEnsured = false

async function ensureLogosBucket() {
  if (logosBucketEnsured) return
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.storage.getBucket(LOGOS_BUCKET)
  if (!data) {
    await supabase.storage.createBucket(LOGOS_BUCKET, { public: true })
  }
  logosBucketEnsured = true
}

export async function uploadBusinessLogo(ownerId: string, filename: string, contentType: string, bytes: Uint8Array) {
  await ensureLogosBucket()
  const supabase = getSupabaseAdmin()
  const path = `${ownerId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from(LOGOS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const PRODUCT_IMAGES_BUCKET = 'product-images'
let productImagesBucketEnsured = false

async function ensureProductImagesBucket() {
  if (productImagesBucketEnsured) return
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET)
  if (!data) {
    await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, { public: true })
  }
  productImagesBucketEnsured = true
}

export async function uploadProductImage(ownerId: string, filename: string, contentType: string, bytes: Uint8Array) {
  await ensureProductImagesBucket()
  const supabase = getSupabaseAdmin()
  const path = `${ownerId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
