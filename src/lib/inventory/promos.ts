import type { OwnerContext } from '@/lib/auth'
import type { Promo, PromoRewardType } from './types'

export async function listPromos(ctx: OwnerContext): Promise<Promo[]> {
  const [{ data: promos, error }, { data: triggers, error: triggersError }, { data: rewards, error: rewardsError }] =
    await Promise.all([
      ctx.supabase.from('promos').select('*').eq('owner_id', ctx.ownerId).order('created_at', { ascending: false }),
      ctx.supabase.from('promo_trigger_products').select('promo_id, product_id').eq('owner_id', ctx.ownerId),
      ctx.supabase.from('promo_reward_products').select('promo_id, product_id').eq('owner_id', ctx.ownerId),
    ])
  if (error) throw error
  if (triggersError) throw triggersError
  if (rewardsError) throw rewardsError

  const triggersByPromo = new Map<string, string[]>()
  for (const row of (triggers as Array<{ promo_id: string; product_id: string }>) ?? []) {
    const list = triggersByPromo.get(row.promo_id) ?? []
    list.push(row.product_id)
    triggersByPromo.set(row.promo_id, list)
  }
  const rewardsByPromo = new Map<string, string[]>()
  for (const row of (rewards as Array<{ promo_id: string; product_id: string }>) ?? []) {
    const list = rewardsByPromo.get(row.promo_id) ?? []
    list.push(row.product_id)
    rewardsByPromo.set(row.promo_id, list)
  }

  return ((promos as Array<Omit<Promo, 'trigger_product_ids' | 'reward_product_ids'>>) ?? []).map((p) => ({
    ...p,
    trigger_product_ids: triggersByPromo.get(p.id) ?? [],
    reward_product_ids: rewardsByPromo.get(p.id) ?? [],
  }))
}

export interface PromoInput {
  code: string
  reward_type: PromoRewardType
  reward_value: number
  active: boolean
  trigger_product_ids: string[]
  reward_product_ids: string[]
}

export async function createPromo(ctx: OwnerContext, input: PromoInput): Promise<Promo> {
  const { data: promo, error } = await ctx.supabase
    .from('promos')
    .insert({
      owner_id: ctx.ownerId,
      code: input.code,
      reward_type: input.reward_type,
      reward_value: input.reward_value,
      active: input.active,
    })
    .select('*')
    .single()
  if (error) throw error

  const promoRow = promo as Omit<Promo, 'trigger_product_ids' | 'reward_product_ids'>
  await syncPromoProducts(ctx, promoRow.id, input)
  return { ...promoRow, trigger_product_ids: input.trigger_product_ids, reward_product_ids: input.reward_product_ids }
}

export async function updatePromo(ctx: OwnerContext, id: string, input: PromoInput): Promise<Promo> {
  const { data: promo, error } = await ctx.supabase
    .from('promos')
    .update({
      code: input.code,
      reward_type: input.reward_type,
      reward_value: input.reward_value,
      active: input.active,
    })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error

  await syncPromoProducts(ctx, id, input)
  const promoRow = promo as Omit<Promo, 'trigger_product_ids' | 'reward_product_ids'>
  return { ...promoRow, trigger_product_ids: input.trigger_product_ids, reward_product_ids: input.reward_product_ids }
}

async function syncPromoProducts(ctx: OwnerContext, promoId: string, input: PromoInput) {
  await ctx.supabase.from('promo_trigger_products').delete().eq('promo_id', promoId).eq('owner_id', ctx.ownerId)
  await ctx.supabase.from('promo_reward_products').delete().eq('promo_id', promoId).eq('owner_id', ctx.ownerId)

  if (input.trigger_product_ids.length > 0) {
    const { error } = await ctx.supabase.from('promo_trigger_products').insert(
      input.trigger_product_ids.map((productId) => ({ owner_id: ctx.ownerId, promo_id: promoId, product_id: productId })),
    )
    if (error) throw error
  }
  if (input.reward_type === 'free_item' && input.reward_product_ids.length > 0) {
    const { error } = await ctx.supabase.from('promo_reward_products').insert(
      input.reward_product_ids.map((productId) => ({ owner_id: ctx.ownerId, promo_id: promoId, product_id: productId })),
    )
    if (error) throw error
  }
}

export async function deletePromo(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('promos').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}
