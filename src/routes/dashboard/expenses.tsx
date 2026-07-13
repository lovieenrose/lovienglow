import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createExpenseFn, deleteExpenseFn, listExpensesFn } from '@/lib/serverFunctions'

export const Route = createFileRoute('/dashboard/expenses')({
  loader: () => listExpensesFn({ data: {} }),
  component: ExpensesPage,
})

function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies', 'Transport', 'Other']

function ExpensesPage() {
  const expenses = Route.useLoaderData()
  const router = useRouter()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return
    setSaving(true)
    await createExpenseFn({ data: { category, description: description || undefined, amount, expense_date: expenseDate } })
    setDescription('')
    setAmount(0)
    setSaving(false)
    await router.invalidate()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpenseFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div className="dash-page">
      <div className="dash-toolbar">
        <h1 className="dash-page__title">Expenses</h1>
        <div className="dash-card" style={{ padding: '10px 20px' }}>
          <div><span className="dash-card__label">Total</span><b className="dash-card__value">{formatPeso(total)}</b></div>
        </div>
      </div>

      <form className="dash-line-item" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr auto', marginBottom: 'var(--space-lg)' }} onSubmit={add}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }} />
        <input type="number" min={0} step="0.01" placeholder="Amount" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))}
          style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }} />
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
          style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }} />
        <button className="button button--dark" disabled={saving}><Plus size={14} /> Add</button>
      </form>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan={5} className="dash-table__empty">No expenses recorded.</td></tr>}
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.expense_date).toLocaleDateString('en-PH')}</td>
                <td>{e.category}</td>
                <td>{e.description ?? '—'}</td>
                <td>{formatPeso(e.amount)}</td>
                <td><button className="button button--outline" onClick={() => remove(e.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
