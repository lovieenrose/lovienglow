import type { OwnerContext } from '@/lib/auth'
import type { Expense } from './types'

export async function listExpenses(
  ctx: OwnerContext,
  filters?: { from?: string; to?: string },
): Promise<Expense[]> {
  let query = ctx.supabase
    .from('expenses')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .order('expense_date', { ascending: false })

  if (filters?.from) query = query.gte('expense_date', filters.from)
  if (filters?.to) query = query.lte('expense_date', filters.to)

  const { data, error } = await query
  if (error) throw error
  return (data as Expense[]) ?? []
}

export interface ExpenseInput {
  category: string
  description?: string
  amount: number
  expense_date: string
  purchase_order_id?: string | null
}

export async function createExpense(ctx: OwnerContext, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await ctx.supabase
    .from('expenses')
    .insert({ owner_id: ctx.ownerId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(ctx: OwnerContext, id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
  const { data, error } = await ctx.supabase
    .from('expenses')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('expenses').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}
