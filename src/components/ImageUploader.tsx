import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadProductImageFn } from '@/lib/serverFunctions'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadFile(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, or WebP images are allowed.')
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be ${MAX_SIZE_MB}MB or smaller.`)
  }
  const base64 = await fileToBase64(file)
  const { url } = await uploadProductImageFn({ data: { filename: file.name, contentType: file.type, base64 } })
  return url
}

function DropZone({ uploading, onFiles, children }: { uploading: boolean; onFiles: (files: FileList) => void; children: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={`image-uploader__dropzone ${dragOver ? 'image-uploader__dropzone--over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {uploading ? <Loader2 size={18} className="image-uploader__spinner" /> : children}
    </div>
  )
}

export function ImageUploaderSingle({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList) => {
    setError('')
    setUploading(true)
    try {
      const url = await uploadFile(files[0])
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className="image-uploader__single-preview">
        <img src={value} alt="Product" />
        <button type="button" className="image-uploader__remove" onClick={() => onChange('')} aria-label="Remove image">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="image-uploader">
      <DropZone uploading={uploading} onFiles={handleFiles}>
        <ImagePlus size={18} />
        <span>Drop image or click to upload</span>
        <small>JPEG, PNG, or WebP — up to {MAX_SIZE_MB}MB</small>
      </DropZone>
      {error && <p className="dash-login__error">{error}</p>}
    </div>
  )
}
