"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { apiClient, API_ENDPOINTS } from "@/lib/api/client"
import type { Photo } from "@/lib/types/photo"

export default function PhotoWall() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const data = await apiClient.get<{ data: Photo[] }>(
        API_ENDPOINTS.photosPublished,
        false // 前台不需要 token
      )
      setPhotos(data.data || [])
    } catch (error) {
      console.error("Failed to load photos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading photos...</div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No photos to display yet</p>
          <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
          <p className="text-gray-600">Explore our curated collection</p>
        </div>

        {/* Pinterest-style Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="break-inside-avoid mb-4"
            >
              <div className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                {/* Image */}
                <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-auto select-none object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center z-10">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center px-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {photo.title}
                      </h3>
                      {photo.description && (
                        <p className="text-sm text-gray-200 line-clamp-2">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Bar */}
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 truncate">
                    {photo.title}
                  </h4>
                  {photo.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {photo.category}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
