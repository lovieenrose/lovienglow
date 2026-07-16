import { FileText, Image as ImageIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { Product } from '@/lib/inventory/types'

const PAGE_WIDTH = 595.28 // A4 pt
const PAGE_HEIGHT = 841.89
const MARGIN = 40
const ROW_HEIGHT = 22
const HEADER_ROW_HEIGHT = 26
const CATEGORY_ROW_HEIGHT = 22
const UNCATEGORIZED = 'Uncategorized'

function formatGeneratedAt(): string {
  return new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })
}

function groupByCategory(products: Product[]): Array<{ name: string; items: Product[] }> {
  const byName = new Map<string, Product[]>()
  for (const product of products) {
    const name = product.category?.name ?? UNCATEGORIZED
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name)!.push(product)
  }
  return [...byName.entries()]
    .sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })
    .map(([name, items]) => ({
      name,
      items: items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    }))
}

export function ExportInventoryModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState<'pdf' | 'png' | null>(null)
  const [error, setError] = useState('')

  const groups = groupByCategory(products)
  const generatedAt = formatGeneratedAt()

  const exportPdf = async () => {
    setGenerating('pdf')
    setError('')
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const colItemX = MARGIN
      const colStockX = PAGE_WIDTH - MARGIN - 160

      const drawReportHeader = () => {
        let y = MARGIN
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(20)
        doc.text('Inventory Report', colItemX, y)
        y += 20
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(110)
        doc.text(`Generated on ${generatedAt}`, colItemX, y)
        doc.setTextColor(0)
        return y + 24
      }

      const drawColumnHeader = (y: number) => {
        doc.setFillColor(214, 51, 108)
        doc.rect(colItemX, y, PAGE_WIDTH - MARGIN * 2, HEADER_ROW_HEIGHT, 'F')
        doc.setTextColor(255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('Item Name', colItemX + 8, y + 17)
        doc.text('Remaining Stocks', colStockX + 8, y + 17)
        doc.setTextColor(0)
        doc.setFont('helvetica', 'normal')
        return y + HEADER_ROW_HEIGHT
      }

      const drawCategoryLabel = (y: number, name: string) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(214, 51, 108)
        doc.text(name, colItemX, y + 15)
        doc.setTextColor(0)
        doc.setFont('helvetica', 'normal')
        return y + CATEGORY_ROW_HEIGHT
      }

      let y = drawReportHeader()
      const bottomLimit = PAGE_HEIGHT - MARGIN

      groups.forEach((group) => {
        if (y + CATEGORY_ROW_HEIGHT + HEADER_ROW_HEIGHT + ROW_HEIGHT > bottomLimit) {
          doc.addPage()
          y = MARGIN
        }
        y = drawCategoryLabel(y, group.name)
        y = drawColumnHeader(y)

        group.items.forEach((product, i) => {
          if (y + ROW_HEIGHT > bottomLimit) {
            doc.addPage()
            y = MARGIN
            y = drawCategoryLabel(y, `${group.name} (continued)`)
            y = drawColumnHeader(y)
          }
          if (i % 2 === 1) {
            doc.setFillColor(250, 236, 242)
            doc.rect(colItemX, y, PAGE_WIDTH - MARGIN * 2, ROW_HEIGHT, 'F')
          }
          doc.setFontSize(10)
          doc.text(product.name, colItemX + 8, y + 15, { maxWidth: colStockX - colItemX - 16 })
          doc.text(`${product.stock_quantity} ${product.unit}`, colStockX + 8, y + 15)
          y += ROW_HEIGHT
        })
        y += 12
      })

      doc.setFontSize(9)
      doc.setTextColor(150)
      const pageCount = doc.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH - MARGIN - 60, PAGE_HEIGHT - 20)
      }

      doc.save(`inventory-report-${Date.now()}.pdf`)
    } catch {
      setError('Could not generate PDF.')
    } finally {
      setGenerating(null)
    }
  }

  const exportPng = async () => {
    if (!previewRef.current) return
    setGenerating('png')
    setError('')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(previewRef.current, { backgroundColor: '#ffffff', scale: 3 })
      const link = document.createElement('a')
      link.download = `inventory-report-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      setError('Could not generate PNG.')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--export" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Export Inventory</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body dash-export-layout">
          <div className="dash-export-preview-wrap">
            <div className="dash-export-preview" ref={previewRef}>
              <div className="dash-export-preview__head">
                <h3>Inventory Report</h3>
                <span className="dash-muted">Generated on {generatedAt}</span>
              </div>
              <div className="dash-export-preview__groups">
                {groups.map((group) => (
                  <div key={group.name} className="dash-export-preview__group">
                    <h4 className="dash-export-preview__category">{group.name}</h4>
                    <table className="dash-invoice-preview__table">
                      <thead>
                        <tr><th>Item Name</th><th>Remaining Stocks</th></tr>
                      </thead>
                      <tbody>
                        {group.items.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.stock_quantity} {product.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-export-side">
            <p className="dash-field__hint">Choose a format to download the complete stock list.</p>
            <button className="button button--outline button--wide" onClick={exportPdf} disabled={generating !== null}>
              <FileText size={14} /> {generating === 'pdf' ? 'Generating…' : 'Export as PDF'}
            </button>
            <button className="button button--outline button--wide" onClick={exportPng} disabled={generating !== null}>
              <ImageIcon size={14} /> {generating === 'png' ? 'Generating…' : 'Export as PNG'}
            </button>
            {error && <p className="dash-login__error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
