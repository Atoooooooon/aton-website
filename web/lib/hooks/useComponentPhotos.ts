import { useState, useEffect } from "react"

export interface ComponentPhoto {
  id: number
  photoId: number
  order: number
  props: {
    caption?: string
    alt?: string
    link?: string
  }
  photo: {
    id: number
    imageUrl: string
    title: string
  }
}

export function useComponentPhotos(componentName: string) {
  const [photos, setPhotos] = useState<ComponentPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `http://localhost:8080/api/v1/components/${componentName}/photos`
        )
        const data = await res.json()
        setPhotos(data.data || [])
        setError(null)
      } catch (err) {
        console.error(`Failed to load photos for ${componentName}:`, err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [componentName])

  return { photos, loading, error }
}
