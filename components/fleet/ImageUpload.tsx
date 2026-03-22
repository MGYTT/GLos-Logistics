'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  onUpload: (urls: string[]) => void
  bucket?: string
  folder?: string
  maxFiles?: number
}

export function ImageUpload({ onUpload, bucket = 'fleet', folder = 'trucks', maxFiles = 5 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews]   = useState<{ file: File; url: string }[]>([])
  const supabase = createClient()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newPreviews = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles))

    setUploading(true)
    const urls: string[] = []

    for (const file of acceptedFiles.slice(0, maxFiles)) {
      const ext  = file.name.split('.').pop()
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        toast.error(`Błąd uploadu: ${file.name}`)
        continue
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      urls.push(data.publicUrl)
    }

    onUpload(urls)
    setUploading(false)
    toast.success(`Wgrano ${urls.length} zdjęć`)
  }, [bucket, folder, maxFiles, onUpload, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles,
    disabled: uploading,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-700 hover:border-zinc-500',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">
          {uploading ? 'Wysyłanie...' : isDragActive ? 'Upuść tutaj!' : 'Przeciągnij zdjęcia lub kliknij'}
        </p>
        <p className="text-xs text-zinc-600 mt-1">JPG, PNG, WEBP · max {maxFiles} plików</p>
      </div>

      {/* Podgląd */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map(({ url }, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setPreviews(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full items-center justify-center hidden group-hover:flex"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
