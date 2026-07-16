import { Check, ImagePlus, Loader2, Minus, Plus, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatPrice } from '@/lib/currency'
import paymentMethods from '@/data/paymentMethods'
import { couriers, shippingRegions } from '@/data/shipping'
import { useStore, type BuyerDetails } from './Store'
import { ProductVisual } from './ProductVisual'

const steps = [
  { number: 1 as const, label: 'Order' },
  { number: 2 as const, label: 'Shipping Details' },
  { number: 3 as const, label: 'Payment' },
]

export function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, goToStep, lastOrder, startNewOrder } = useStore()

  if (!checkoutOpen) return null

  return (
    <div className="modal-layer checkout-layer" aria-hidden={!checkoutOpen}>
      <button className="modal-backdrop" onClick={closeCheckout} aria-label="Close checkout" />
      <div className="checkout-modal" role="dialog" aria-label="Checkout">
        <button className="modal-close" onClick={closeCheckout} aria-label="Close checkout">
          <X size={16} />
        </button>
        {lastOrder ? (
          <OrderConfirmed onDone={startNewOrder} />
        ) : (
          <>
            <div className="checkout-progress">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`checkout-progress__step ${checkoutStep === step.number ? 'is-active' : ''} ${checkoutStep > step.number ? 'is-done' : ''}`}
                >
                  <span>{checkoutStep > step.number ? <Check size={12} /> : step.number}</span>
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
  const { cart, catalog, updateQuantity, removeFromCart } = useStore()
  const lines = Object.entries(cart)
    .map(([id, quantity]) => ({ product: catalog.find((item) => item.id === id), quantity }))
    .filter((line): line is { product: NonNullable<typeof line.product>; quantity: number } => Boolean(line.product))
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  return { lines, subtotal, updateQuantity, removeFromCart }
}

function StepOrder({ onContinue }: { onContinue: () => void }) {
  const { lines, subtotal, updateQuantity, removeFromCart } = useCartLines()

  return (
    <div className="checkout-step">
      <h2>Order Summary</h2>
      <p className="checkout-step__hint">
        Review your items and adjust quantities before continuing.
      </p>
      <div className="order-card">
        {lines.length === 0 ? (
          <p className="order-empty">
            Your cart is empty. Close this window and add products first.
          </p>
        ) : (
          lines.map(({ product, quantity }) => (
            <div className="order-line" key={product.id}>
              {product.gallery?.[0] ?? product.image ? (
                <img src={product.gallery?.[0] ?? product.image} alt={product.name} className="cart-line__photo" />
              ) : (
                <ProductVisual product={product} compact />
              )}
              <div className="order-line__info">
                <h3>{product.name}</h3>
                <span>{formatPrice(product.price)} each</span>
              </div>
              <div className="quantity">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="order-line__price">
                <b>{formatPrice(product.price * quantity)}</b>
                <button onClick={() => removeFromCart(product.id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="checkout-footer">
        <div className="checkout-total-row">
          <span>Items Subtotal</span>
          <b>{formatPrice(subtotal)}</b>
        </div>
        <button
          className="button button--dark button--wide"
          disabled={!lines.length}
          onClick={onContinue}
          id="checkout-continue-to-shipping"
        >
          Continue to Shipping
        </button>
      </div>
    </div>
  )
}

const requiredFields: (keyof BuyerDetails)[] = ['fullName', 'contactNumber', 'email', 'address']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function StepDetails({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { buyer, setBuyerField, courier, setCourier, region, setRegion } = useStore()
  const [touched, setTouched] = useState(false)
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0]
  const isLalamove = courier === 'lalamove'
  const valid = requiredFields.every((field) => buyer[field].trim().length > 0) && EMAIL_PATTERN.test(buyer.email.trim())

  const handleContinue = () => {
    setTouched(true)
    if (valid) onContinue()
  }

  return (
    <div className="checkout-step">
      <h2>Shipping Details</h2>
      <p className="checkout-step__hint">
        Enter your delivery information. Fields marked with * are required.
      </p>

      <div className="checkout-form">
        <label className={touched && !buyer.fullName ? 'has-error' : ''}>
          <span>Full Name *</span>
          <input
            value={buyer.fullName}
            onChange={(event) => setBuyerField('fullName', event.target.value)}
            placeholder="e.g. Juana Dela Cruz"
            autoComplete="name"
          />
          {touched && !buyer.fullName && <em className="field-error">Full name is required.</em>}
        </label>
        <label className={touched && !buyer.contactNumber ? 'has-error' : ''}>
          <span>Contact Number *</span>
          <input
            value={buyer.contactNumber}
            onChange={(event) => setBuyerField('contactNumber', event.target.value)}
            placeholder="09XX XXX XXXX"
            type="tel"
            autoComplete="tel"
          />
          {touched && !buyer.contactNumber && (
            <em className="field-error">Contact number is required.</em>
          )}
        </label>
        <label className={touched && !EMAIL_PATTERN.test(buyer.email.trim()) ? 'has-error' : ''}>
          <span>Email Address *</span>
          <input
            type="email"
            value={buyer.email}
            onChange={(event) => setBuyerField('email', event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
          {touched && !buyer.email && <em className="field-error">Email address is required.</em>}
          {touched && buyer.email && !EMAIL_PATTERN.test(buyer.email.trim()) && (
            <em className="field-error">Enter a valid email address.</em>
          )}
        </label>
        <label>
          <span>Discord / Social Handle</span>
          <input
            value={buyer.socialHandle}
            onChange={(event) => setBuyerField('socialHandle', event.target.value)}
            placeholder="@username (optional)"
          />
        </label>
        <label className={`span-2 ${touched && !buyer.address ? 'has-error' : ''}`}>
          <span>Delivery Address *</span>
          <textarea
            value={buyer.address}
            onChange={(event) => setBuyerField('address', event.target.value)}
            placeholder="House/unit, street, barangay, city, province"
            rows={3}
            autoComplete="street-address"
          />
          {touched && !buyer.address && <em className="field-error">Delivery address is required.</em>}
        </label>
      </div>

      <div className="checkout-subhead">Courier</div>
      <div className="option-grid">
        {couriers.map((item) => (
          <button
            key={item.id}
            className={`option-tile ${courier === item.id ? 'is-active' : ''}`}
            onClick={() => setCourier(item.id)}
          >
            <b>{item.label}</b>
            <span>{item.note}</span>
          </button>
        ))}
      </div>

      {isLalamove ? (
        <div className="checkout-notice checkout-notice--lalamove" role="note">
          <strong>Choosing Lalamove?</strong> Please get in touch with us at{' '}
          <a href="mailto:lovin.glow.ph@gmail.com" className="notice-link">lovin.glow.ph@gmail.com</a>{' '}
          to arrange your booking.
          <br /><br />
          <strong>Note:</strong> The delivery fee is handled separately and will{' '}
          <em>not</em> be charged at checkout.
        </div>
      ) : (
        <>
          <div className="checkout-subhead">Shipping Region</div>
          <div className="option-grid option-grid--three">
            {shippingRegions.map((item) => (
              <button
                key={item.id}
                className={`option-tile ${region === item.id ? 'is-active' : ''}`}
                onClick={() => setRegion(item.id)}
              >
                <b>{item.label}</b>
                <span>{formatPrice(item.fee)}</span>
              </button>
            ))}
          </div>
          <div className="checkout-notice">
            <strong>Note:</strong> Shipping fees are estimates and may vary depending on package
            weight and the number of parcels. Your selected region ({selectedRegion.label}) adds{' '}
            {formatPrice(selectedRegion.fee)} to your total.
          </div>
        </>
      )}

      <div className="checkout-footer checkout-footer--split">
        <button className="button button--outline" onClick={onBack} id="checkout-back-to-order">
          Back
        </button>
        <button
          className="button button--dark"
          onClick={handleContinue}
          id="checkout-continue-to-payment"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}

function StepPayment({ onBack }: { onBack: () => void }) {
  const {
    paymentMethodId,
    setPaymentMethodId,
    receiptFile,
    setReceiptFile,
    region,
    courier,
    orderReference,
    placingOrder,
    placeOrder,
    promoCode,
    setPromoCode,
    promoDiscount,
    promoError,
    promoApplying,
    appliedPromoId,
    applyPromoCode,
  } = useStore()
  const { lines, subtotal } = useCartLines()
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isLalamove = courier === 'lalamove'
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0]
  const shippingFee = isLalamove ? 0 : selectedRegion.fee
  const total = Math.max(0, subtotal - promoDiscount) + shippingFee
  const method = paymentMethods.find((item) => item.id === paymentMethodId)

  const handleFile = (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return
    setReceiptFile(file)
  }

  return (
    <div className="checkout-step">
      <h2>Payment</h2>
      <p className="checkout-step__hint">
        Order Reference: <b className="order-ref">{orderReference}</b>
      </p>

      <div className="order-card order-card--summary">
        {lines.map(({ product, quantity }) => (
          <div className="summary-line" key={product.id}>
            <span>{product.name} × {quantity}</span>
            <b>{formatPrice(product.price * quantity)}</b>
          </div>
        ))}
        <div className="summary-line">
          <span>Order Subtotal</span>
          <b>{formatPrice(subtotal)}</b>
        </div>
        {promoDiscount > 0 && (
          <div className="summary-line">
            <span>Discount ({promoCode.trim().toUpperCase()})</span>
            <b>-{formatPrice(promoDiscount)}</b>
          </div>
        )}
        <div className="summary-line">
          {isLalamove ? (
            <>
              <span>Shipping Fee</span>
              <b className="shipping-arranged">Arranged separately</b>
            </>
          ) : (
            <>
              <span>Shipping Fee ({selectedRegion.label})</span>
              <b>{formatPrice(shippingFee)}</b>
            </>
          )}
        </div>
        <div className="summary-line summary-line--total">
          <span>Total Amount Due</span>
          <b>{formatPrice(total)}</b>
        </div>
      </div>

      <div className="checkout-subhead">Promo Code</div>
      <div className="promo-row">
        <input
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value)}
          placeholder="e.g. FIRSTDAY"
          disabled={Boolean(appliedPromoId)}
        />
        <button
          type="button"
          className="button button--outline"
          onClick={applyPromoCode}
          disabled={promoApplying || !promoCode.trim() || Boolean(appliedPromoId)}
        >
          {promoApplying ? 'Checking…' : appliedPromoId ? 'Applied' : 'Apply'}
        </button>
      </div>
      {promoError && !appliedPromoId && <p className="field-error">{promoError}</p>}
      {appliedPromoId && <p className="promo-success">Promo applied — you saved {formatPrice(promoDiscount)}!</p>}

      {isLalamove && (
        <div className="checkout-notice checkout-notice--lalamove" role="note">
          <strong>Lalamove delivery fee not included.</strong> Please contact us at{' '}
          <a href="mailto:lovin.glow.ph@gmail.com" className="notice-link">lovin.glow.ph@gmail.com</a>{' '}
          to coordinate your booking after placing your order.
        </div>
      )}

      <div className="checkout-subhead">Payment Method</div>
      <div className="payment-grid">
        {paymentMethods.map((item) => (
          <button
            key={item.id}
            className={`payment-pill ${paymentMethodId === item.id ? 'is-active' : ''}`}
            onClick={() => setPaymentMethodId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {method && (
        <div className="payment-details">
          {method.qrImage && (
            <img
              src={method.qrImage}
              alt={`${method.label} QR code`}
              className="payment-qr"
              onError={(event) => { (event.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div>
            <b>{method.accountName}</b>
            <span>{method.accountNumber}</span>
            {method.note && <p>{method.note}</p>}
          </div>
        </div>
      )}

      <div className="checkout-subhead">Upload Payment Receipt</div>
      <p className="checkout-step__hint">Attach your GCash, Maya, or bank transfer receipt (image or PDF).</p>
      <div
        className={`upload-zone ${dragOver ? 'is-drag' : ''} ${receiptFile ? 'has-file' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload payment receipt"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        {receiptFile ? (
          <>
            <ImagePlus size={24} />
            <b>{receiptFile.name}</b>
            <span>Click to replace</span>
          </>
        ) : (
          <>
            <UploadCloud size={24} />
            <b>Drag &amp; drop your receipt here</b>
            <span>or click to browse — JPG, PNG, or PDF</span>
          </>
        )}
      </div>

      <div className="checkout-footer checkout-footer--split">
        <button className="button button--outline" onClick={onBack} id="checkout-back-to-shipping">
          Back
        </button>
        <button
          className="button button--dark"
          disabled={!method || !receiptFile || placingOrder}
          onClick={placeOrder}
          id="place-order-button"
        >
          {placingOrder ? (
            <><Loader2 className="spin" size={14} /> Placing Order…</>
          ) : (
            'Place Order'
          )}
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
  const isLalamove = lastOrder.courier === 'lalamove'
  const placedDate = new Date(lastOrder.placedAt).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="order-confirmed">
      <span className="order-confirmed__icon"><Check size={24} /></span>
      <span className="confirmed-label">Order Placed Successfully</span>
      <h2>Thank you, {lastOrder.buyer.fullName.split(' ')[0] || 'for your order'}!</h2>
      <p>
        Your order reference is <b>{lastOrder.reference}</b>. We are verifying your payment
        and will reach out to you shortly.
      </p>

      <div className="order-card order-card--summary">
        {lastOrder.lines.map((line, i) => (
          <div className="summary-line" key={`${line.productId}-${i}`}>
            <span>{line.name} × {line.quantity}</span>
            <b>{formatPrice(line.price * line.quantity)}</b>
          </div>
        ))}
        {lastOrder.discount > 0 && (
          <div className="summary-line">
            <span>Discount</span>
            <b>-{formatPrice(lastOrder.discount)}</b>
          </div>
        )}
        <div className="summary-line">
          {isLalamove ? (
            <>
              <span>Shipping Fee</span>
              <b className="shipping-arranged">Arranged separately</b>
            </>
          ) : (
            <>
              <span>Shipping Fee ({region?.label})</span>
              <b>{formatPrice(lastOrder.shippingFee)}</b>
            </>
          )}
        </div>
        <div className="summary-line summary-line--total">
          <span>Total Paid via {method?.label}</span>
          <b>{formatPrice(lastOrder.total)}</b>
        </div>
      </div>

      <div className="order-confirmed__meta">
        <div><span>Date &amp; Time</span><b>{placedDate}</b></div>
        <div><span>Delivery Address</span><b>{lastOrder.buyer.address}</b></div>
        <div><span>Receipt on File</span><b>{lastOrder.receiptName}</b></div>
      </div>

      <button className="button button--dark button--wide" onClick={onDone} id="continue-shopping-btn">
        Continue Shopping
      </button>
    </div>
  )
}
