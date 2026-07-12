export interface Courier {
  id: string
  label: string
  note: string
}

export const couriers: Courier[] = [
  { id: 'jnt', label: 'J&T Express', note: 'Nationwide delivery' },
  { id: 'lalamove', label: 'Lalamove', note: 'Metro Manila only' },
]

export interface ShippingRegion {
  id: string
  label: string
  fee: number
}

// Edit fees any time — the checkout total updates automatically.
export const shippingRegions: ShippingRegion[] = [
  { id: 'luzon', label: 'Luzon', fee: 120 },
  { id: 'visayas', label: 'Visayas', fee: 180 },
  { id: 'mindanao', label: 'Mindanao', fee: 200 },
]
