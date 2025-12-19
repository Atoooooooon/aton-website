"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
import { PhotoList } from "@/components/admin/PhotoList";
import { ArrowLeft } from "lucide-react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { apiClient, API_ENDPOINTS } from "@/lib/api/client";
import type { Photo } from "@/lib/types/photo";

export default function PhotoManagementPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!apiClient.isAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await apiClient.get<{ data: Photo[] }>(
        API_ENDPOINTS.photos
        // requireAuth = true (默认)
      );
      setPhotos(data.data || []);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header with mint green accent */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 -ml-1 self-start"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Photo Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Upload and manage your photography collection
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <PhotoUpload onUploadSuccess={loadPhotos} />
            </div>

            {/* Photos List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : (
                <PhotoList photos={photos} onUpdate={loadPhotos} />
              )}
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}