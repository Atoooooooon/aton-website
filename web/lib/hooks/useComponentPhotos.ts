import { useState, useEffect } from "react"
import { apiClient, API_ENDPOINTS } from "../api/client"
import type { ComponentPhoto } from "../types/photo"

export function useComponentPhotos(componentName: string) {
  const [photos, setPhotos] = useState<ComponentPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true)
        const data = await apiClient.get<{ data: ComponentPhoto[] }>(
          API_ENDPOINTS.componentPhotosList(componentName),
          false // 前台组件不需要 token
        )
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
