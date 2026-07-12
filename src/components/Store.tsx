import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import products from '@/data/products'
import { submitOrderFn } from '@/lib/serverFunctions'

export interface BuyerDetails {
  fullName: string
  socialHandle: string
  contactNumber: string
  email: string
  address: string
}

export interface OrderRecord {
  reference: string
  placedAt: string
  lines: { productId: number; name: string; price: number; quantity: number }[]
  subtotal: number
  shippingFee: number
  total: number
  buyer: BuyerDetails
  courier: string
  region: string
  paymentMethod: string
  receiptName: string
}

const emptyBuyer: BuyerDetails = { fullName: '', socialHandle: '', contactNumber: '', email: '', address: '' }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const ORDER_COUNTER_KEY = 'lng_order_counter'

function generateReference(): string {
  // localStorage is only available in the browser — the SSR pass uses a
  // static placeholder which is immediately overwritten on the client.
  if (typeof localStorage === 'undefined') return 'LNG-000000'
  const last = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) ?? '0', 10)
  const next = last + 1
  localStorage.setItem(ORDER_COUNTER_KEY, String(next))
  return `LNG-${String(next).padStart(6, '0')}`
}

interface StoreContextValue {
  cart: Record<number, number>
  cartOpen: boolean
  toast: string
  query: string
  setQuery: (value: string) => void
  addToCart: (id: number, quantity?: number) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  setCartOpen: (open: boolean) => void

  checkoutOpen: boolean
  checkoutStep: 1 | 2 | 3
  openCheckout: () => void
  closeCheckout: () => void
  goToStep: (step: 1 | 2 | 3) => void

  buyer: BuyerDetails
  setBuyerField: (field: keyof BuyerDetails, value: string) => void
  courier: string
  setCourier: (id: string) => void
  region: string
  setRegion: (id: string) => void
  paymentMethodId: string
  setPaymentMethodId: (id: string) => void
  receiptFile: File | null
  setReceiptFile: (file: File | null) => void

  orderReference: string
  placingOrder: boolean
  lastOrder: OrderRecord | null
  placeOrder: () => Promise<OrderRecord | null>
  startNewOrder: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1)
  const [buyer, setBuyer] = useState<BuyerDetails>(emptyBuyer)
  const [courier, setCourier] = useState('jnt')
  const [region, setRegion] = useState('luzon')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null)
  const [orderReference, setOrderReference] = useState(generateReference)

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const addToCart = (id: number, quantity = 1) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + quantity }))
    notify('Added to cart')
  }

  const removeFromCart = (id: number) => {
    setCart((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return removeFromCart(id)
    setCart((current) => ({ ...current, [id]: quantity }))
  }

  const openCheckout = () => {
    setCartOpen(false)
    setCheckoutStep(1)
    setOrderReference(generateReference())
    setCheckoutOpen(true)
  }
  const closeCheckout = () => setCheckoutOpen(false)
  const goToStep = (step: 1 | 2 | 3) => setCheckoutStep(step)

  const setBuyerField = (field: keyof BuyerDetails, value: string) =>
    setBuyer((current) => ({ ...current, [field]: value }))

  const placeOrder = async (): Promise<OrderRecord | null> => {
    if (!receiptFile) return null
    setPlacingOrder(true)
    try {
      const lines = Object.entries(cart).map(([id, quantity]) => {
        const product = products.find((item) => item.id === Number(id))!
        return { productId: product.id, name: product.name, price: product.price, quantity }
      })
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
      // Lalamove deliveries are arranged directly with the store — no fee at checkout.
      const shippingFee =
        courier === 'lalamove'
          ? 0
          : region === 'visayas'
            ? 180
            : region === 'mindanao'
              ? 200
              : 120
      const total = subtotal + shippingFee
      const receiptBase64 = await fileToBase64(receiptFile)

      const saved = await submitOrderFn({
        data: {
          fullName: buyer.fullName,
          contactNumber: buyer.contactNumber,
          email: buyer.email,
          socialHandle: buyer.socialHandle,
          address: buyer.address,
          courier,
          region,
          paymentMethod: paymentMethodId,
          items: lines.map((line) => ({
            productId: line.productId,
            productName: line.name,
            unitPrice: line.price,
            quantity: line.quantity,
            lineTotal: line.price * line.quantity,
          })),
          subtotal,
          shippingFee,
          total,
          receiptBase64,
          receiptFilename: receiptFile.name,
          receiptContentType: receiptFile.type || 'application/octet-stream',
        },
      })

      const order: OrderRecord = {
        reference: saved.reference,
        placedAt: saved.placed_at,
        lines,
        subtotal: saved.subtotal,
        shippingFee: saved.shipping_fee,
        total: saved.total,
        buyer,
        courier,
        region,
        paymentMethod: paymentMethodId,
        receiptName: receiptFile.name,
      }
      setLastOrder(order)
      setCart({})
      return order
    } finally {
      setPlacingOrder(false)
    }
  }

  const startNewOrder = () => {
    setLastOrder(null)
    setBuyer(emptyBuyer)
    setCourier('jnt')
    setRegion('luzon')
    setPaymentMethodId('')
    setReceiptFile(null)
    setCheckoutStep(1)
    setOrderReference(generateReference())
    setCheckoutOpen(false)
  }

  return (
    <StoreContext.Provider
      value={{
        cart, cartOpen, toast, query, setQuery, addToCart, removeFromCart, updateQuantity, setCartOpen,
        checkoutOpen, checkoutStep, openCheckout, closeCheckout, goToStep,
        buyer, setBuyerField, courier, setCourier, region, setRegion, paymentMethodId, setPaymentMethodId,
        receiptFile, setReceiptFile, orderReference, placingOrder, lastOrder, placeOrder, startNewOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}
