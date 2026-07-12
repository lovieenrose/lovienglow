export interface PaymentMethod {
  id: string
  label: string
  type: 'ewallet' | 'bank'
  accountName: string
  accountNumber: string
  note?: string
  // Drop a QR image at public/payments/<id>.png and it will be used automatically.
  qrImage?: string
}

// Edit this list to match your real GCash / Maya / bank details.
// Add more entries any time — new methods appear automatically at checkout.
const paymentMethods: PaymentMethod[] = [
  { id: 'gcash', label: 'GCash', type: 'ewallet', accountName: 'Lovie N Glow', accountNumber: '0917 000 0000', qrImage: '/payments/gcash.png', note: 'Scan the QR or send to the number above.' },
  { id: 'maya', label: 'Maya', type: 'ewallet', accountName: 'Lovie N Glow', accountNumber: '0917 000 0000', qrImage: '/payments/maya.png', note: 'Scan the QR or send to the number above.' },
  { id: 'bdo', label: 'BDO', type: 'bank', accountName: 'Lovie N Glow', accountNumber: '0000 0000 0000', note: 'BDO Savings Account.' },
  { id: 'bpi', label: 'BPI', type: 'bank', accountName: 'Lovie N Glow', accountNumber: '0000 0000 0000', note: 'BPI Savings Account.' },
  { id: 'gotyme', label: 'GoTyme', type: 'bank', accountName: 'Lovie N Glow', accountNumber: '0000 0000 0000', note: 'GoTyme Save Up Account.' },
  { id: 'maribank', label: 'Maribank', type: 'bank', accountName: 'Lovie N Glow', accountNumber: '0000 0000 0000', note: 'Maribank Savings Account.' },
]

export default paymentMethods
