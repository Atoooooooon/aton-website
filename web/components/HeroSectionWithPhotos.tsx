"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiClient, API_ENDPOINTS } from "@/lib/api/client";
import type { ComponentPhoto } from "@/lib/types/photo";

export function HeroSectionWithPhotos() {
  const [photos, setPhotos] = useState<ComponentPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await apiClient.get<{ data: ComponentPhoto[] }>(
        API_ENDPOINTS.componentPhotosList("HeroSection"),
        false // 前台不需要 token
      );
      setPhotos(data.data || []);
    } catch (error) {
      console.error("Failed to load hero photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If no photos assigned, show default content
  if (photos.length === 0) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Welcome to Aton</h1>
          <p className="text-xl opacity-90">
            No hero images configured. Please assign photos in admin panel.
          </p>
        </div>
      </div>
    );
  }

  // Show first photo as hero (or you can implement a carousel)
  const heroPhoto = photos[0];

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={heroPhoto.photo.imageUrl}
          alt={heroPhoto.props.alt || heroPhoto.photo.title}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-6xl font-bold mb-6 drop-shadow-lg">
            {heroPhoto.props.caption || heroPhoto.photo.title}
          </h1>
          {heroPhoto.props.link && (
            <a
              href={heroPhoto.props.link}
              className="inline-block px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Learn More
            </a>
          )}
        </div>
      </div>

      {/* Photo Count Indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === 0 ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
