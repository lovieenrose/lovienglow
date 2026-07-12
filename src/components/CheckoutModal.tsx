import { Check, ImagePlus, Loader2, Minus, Plus, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import products, { formatPrice } from '@/data/products'
import paymentMethods from '@/data/paymentMethods'
import { couriers, shippingRegions } from '@/data/shipping'
import { useStore, type BuyerDetails } from './Store'
import { ProductVisual } from './ProductVisual'

const steps = [
  { number: 1 as const, label: 'Order' },
  { number: 2 as const, label: 'Details' },
  { number: 3 as const, label: 'Payment' },
]

export function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, goToStep, lastOrder, startNewOrder } = useStore()

  if (!checkoutOpen) return null

  return (
    <div className="modal-layer checkout-layer" aria-hidden={!checkoutOpen}>
      <button className="modal-backdrop" onClick={closeCheckout} aria-label="Close checkout" />
      <div className="checkout-modal">
        <button className="modal-close" onClick={closeCheckout} aria-label="Close checkout"><X /></button>
        {lastOrder ? (
          <OrderConfirmed onDone={startNewOrder} />
        ) : (
          <>
            <div className="checkout-progress">
              {steps.map((step) => (
                <div key={step.number} className={`checkout-progress__step ${checkoutStep === step.number ? 'is-active' : ''} ${checkoutStep > step.number ? 'is-done' : ''}`}>
                  <span>{checkoutStep > step.number ? <Check size={13} /> : step.number}</span>
                  <b>{step.label}</b>
                </div>
              ))}
            </div>
            <div className="checkout-body">
              {checkoutStep === 1 && <StepOrder onContinue={() => goToStep(2)} />}
              {checkoutStep === 2 && <StepDetails onBack={() => goToStep(1)} onContinue={() => goToStep(3)} />}
              {checkoutStep === 3 && <StepPayment onBack={() => goToStep(2)} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function useCartLines() {
  const { cart, updateQuantity, removeFromCart } = useStore()
  const lines = Object.entries(cart).map(([id, quantity]) => ({ product: products.find((item) => item.id === Number(id))!, quantity }))
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  return { lines, subtotal, updateQuantity, removeFromCart }
}

function StepOrder({ onContinue }: { onContinue: () => void }) {
  const { lines, subtotal, updateQuantity, removeFromCart } = useCartLines()

  return (
    <div className="checkout-step">
      <h2>Your order</h2>
      <p className="checkout-step__hint">Double-check quantities before moving on — you can still adjust them here.</p>
      <div className="order-card">
        {lines.length === 0 ? (
          <p className="order-empty">Your bag is empty. Close this window and add something you love first.</p>
        ) : lines.map(({ product, quantity }) => (
          <div className="order-line" key={product.id}>
            <ProductVisual product={product} compact />
            <div className="order-line__info">
              <h3>{product.name}</h3>
              <span>{formatPrice(product.price)} each</span>
            </div>
            <div className="quantity">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Decrease quantity"><Minus size={12} /></button>
              <span>{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} aria-label="Increase quantity"><Plus size={12} /></button>
            </div>
            <div className="order-line__price">
              <b>{formatPrice(product.price * quantity)}</b>
              <button onClick={() => removeFromCart(product.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="checkout-footer">
        <div className="checkout-total-row"><span>Items subtotal</span><b>{formatPrice(subtotal)}</b></div>
        <button className="button button--dark button--wide" disabled={!lines.length} onClick={onContinue}>Continue to details</button>
      </div>
    </div>
  )
}

const requiredFields: (keyof BuyerDetails)[] = ['fullName', 'contactNumber', 'address']

function StepDetails({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { buyer, setBuyerField, courier, setCourier, region, setRegion } = useStore()
  const [touched, setTouched] = useState(false)
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0]
  const valid = requiredFields.every((field) => buyer[field].trim().length > 0)

  const handleContinue = () => {
    setTouched(true)
    if (valid) onContinue()
  }

  return (
    <div className="checkout-step">
      <h2>Buyer details</h2>
      <p className="checkout-step__hint">We'll use this to prepare your parcel and coordinate delivery.</p>

      <div className="checkout-form">
        <label className={touched && !buyer.fullName ? 'has-error' : ''}>
          <span>Full name*</span>
          <input value={buyer.fullName} onChange={(event) => setBuyerField('fullName', event.target.value)} placeholder="Juana Dela Cruz" />
        </label>
        <label>
          <span>Discord / social handle</span>
          <input value={buyer.socialHandle} onChange={(event) => setBuyerField('socialHandle', event.target.value)} placeholder="@username (optional)" />
        </label>
        <label className={touched && !buyer.contactNumber ? 'has-error' : ''}>
          <span>Contact number*</span>
          <input value={buyer.contactNumber} onChange={(event) => setBuyerField('contactNumber', event.target.value)} placeholder="09XX XXX XXXX" />
        </label>
        <label>
          <span>Email address</span>
          <input type="email" value={buyer.email} onChange={(event) => setBuyerField('email', event.target.value)} placeholder="you@email.com (optional)" />
        </label>
        <label className={`span-2 ${touched && !buyer.address ? 'has-error' : ''}`}>
          <span>Delivery address*</span>
          <textarea value={buyer.address} onChange={(event) => setBuyerField('address', event.target.value)} placeholder="House / unit, street, barangay, city, province" rows={3} />
        </label>
      </div>

      <div className="checkout-subhead">Courier preference</div>
      <div className="option-grid">
        {couriers.map((item) => (
          <button key={item.id} className={`option-tile ${courier === item.id ? 'is-active' : ''}`} onClick={() => setCourier(item.id)}>
            <b>{item.label}</b>
            <span>{item.note}</span>
          </button>
        ))}
      </div>

      <div className="checkout-subhead">Shipping region</div>
      <div className="option-grid option-grid--three">
        {shippingRegions.map((item) => (
          <button key={item.id} className={`option-tile ${region === item.id ? 'is-active' : ''}`} onClick={() => setRegion(item.id)}>
            <b>{item.label}</b>
            <span>{formatPrice(item.fee)}</span>
          </button>
        ))}
      </div>
      <div className="checkout-notice">Shipping fees are estimates and may vary depending on package weight and the number of parcels. Your selected region ({selectedRegion.label}) adds {formatPrice(selectedRegion.fee)} to your total.</div>

      <div className="checkout-footer checkout-footer--split">
        <button className="button button--outline" onClick={onBack}>Back</button>
        <button className="button button--dark" onClick={handleContinue}>Continue to payment</button>
      </div>
    </div>
  )
}

function StepPayment({ onBack }: { onBack: () => void }) {
  const { paymentMethodId, setPaymentMethodId, receiptFile, setReceiptFile, region, orderReference, placingOrder, placeOrder } = useStore()
  const { lines, subtotal } = useCartLines()
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0]
  const total = subtotal + selectedRegion.fee
  const method = paymentMethods.find((item) => item.id === paymentMethodId)

  const handleFile = (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return
    setReceiptFile(file)
  }

  return (
    <div className="checkout-step">
      <h2>Payment</h2>
      <p className="checkout-step__hint">Order reference <b className="order-ref">{orderReference}</b></p>

      <div className="order-card order-card--summary">
        {lines.map(({ product, quantity }) => (
          <div className="summary-line" key={product.id}><span>{product.name} × {quantity}</span><b>{formatPrice(product.price * quantity)}</b></div>
        ))}
        <div className="summary-line"><span>Items subtotal</span><b>{formatPrice(subtotal)}</b></div>
        <div className="summary-line"><span>Shipping ({selectedRegion.label})</span><b>{formatPrice(selectedRegion.fee)}</b></div>
        <div className="summary-line summary-line--total"><span>Grand total</span><b>{formatPrice(total)}</b></div>
      </div>

      <div className="checkout-subhead">Choose a payment method</div>
      <div className="payment-grid">
        {paymentMethods.map((item) => (
          <button key={item.id} className={`payment-pill ${paymentMethodId === item.id ? 'is-active' : ''}`} onClick={() => setPaymentMethodId(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {method && (
        <div className="payment-details">
          {method.qrImage && <img src={method.qrImage} alt={`${method.label} QR code`} className="payment-qr" onError={(event) => { (event.target as HTMLImageElement).style.display = 'none' }} />}
          <div>
            <b>{method.accountName}</b>
            <span>{method.accountNumber}</span>
            {method.note && <p>{method.note}</p>}
          </div>
        </div>
      )}

      <div className="checkout-subhead">Upload your payment confirmation</div>
      <p className="checkout-step__hint">Attach your GCash, Maya, or bank transfer receipt (image or PDF).</p>
      <div
        className={`upload-zone ${dragOver ? 'is-drag' : ''} ${receiptFile ? 'has-file' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => { event.preventDefault(); setDragOver(false); handleFile(event.dataTransfer.files?.[0]) }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*,application/pdf" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
        {receiptFile ? (
          <><ImagePlus /><b>{receiptFile.name}</b><span>Tap to replace</span></>
        ) : (
          <><UploadCloud /><b>Drag & drop your receipt here</b><span>or tap to browse — JPG, PNG, or PDF</span></>
        )}
      </div>

      <div className="checkout-footer checkout-footer--split">
        <button className="button button--outline" onClick={onBack}>Back</button>
        <button className="button button--dark" disabled={!method || !receiptFile || placingOrder} onClick={placeOrder}>
          {placingOrder ? <><Loader2 className="spin" size={14} /> Placing order…</> : 'Place order'}
        </button>
      </div>
    </div>
  )
}

function OrderConfirmed({ onDone }: { onDone: () => void }) {
  const { lastOrder } = useStore()
  if (!lastOrder) return null
  const region = shippingRegions.find((item) => item.id === lastOrder.region)
  const method = paymentMethods.find((item) => item.id === lastOrder.paymentMethod)

  return (
    <div className="order-confirmed">
      <span className="order-confirmed__icon"><Check /></span>
      <span className="eyebrow">Order received</span>
      <h2>Thank you, {lastOrder.buyer.fullName.split(' ')[0] || 'lovely'}.</h2>
      <p>Your order reference is <b>{lastOrder.reference}</b>. We're verifying your payment now — you'll hear from us shortly.</p>
      <div className="order-card order-card--summary">
        {lastOrder.lines.map((line) => (
          <div className="summary-line" key={line.productId}><span>{line.name} × {line.quantity}</span><b>{formatPrice(line.price * line.quantity)}</b></div>
        ))}
        <div className="summary-line"><span>Shipping ({region?.label})</span><b>{formatPrice(lastOrder.shippingFee)}</b></div>
        <div className="summary-line summary-line--total"><span>Total paid via {method?.label}</span><b>{formatPrice(lastOrder.total)}</b></div>
      </div>
      <p className="order-confirmed__note">Receipt on file: {lastOrder.receiptName}. Delivering to {lastOrder.buyer.address}.</p>
      <button className="button button--dark button--wide" onClick={onDone}>Continue shopping</button>
    </div>
  )
}
