"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient, API_ENDPOINTS, ApiError } from "@/lib/api/client";

interface PhotoUploadProps {
  onUploadSuccess: () => void;
}

export function PhotoUploadSimple({ onUploadSuccess }: PhotoUploadProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "landscape",
    location: "",
    isFeatured: false,
    displayOrder: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setShowFullForm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setShowFullForm(false);
    setFormData({
      title: "",
      description: "",
      category: "landscape",
      location: "",
      isFeatured: false,
      displayOrder: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast("Please select an image", "warning");
      return;
    }

    setUploading(true);

    try {
      // 1. Get upload token
      const tokenData = await apiClient.post<{
        uploadUrl: string;
        fileUrl: string;
      }>(API_ENDPOINTS.uploadToken, {
        filename: selectedFile.name,
        contentType: selectedFile.type,
      });

      const { uploadUrl, fileUrl } = tokenData;

      // 2. Upload to MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      // 3. Save photo record
      await apiClient.post(API_ENDPOINTS.photos, {
        ...formData,
        imageUrl: fileUrl,
      });

      showToast("Photo uploaded successfully!", "success");
      handleCancel();
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof ApiError ? error.message : "Upload failed";
      showToast(message, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload New Photo
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* File Selection */}
        {!preview ? (
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="mt-2 text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </label>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleCancel}
                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Quick Form */}
            {showFullForm && (
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Photo title *"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                </div>

                {/* Row: Category + Order */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="street">Street</option>
                    <option value="architecture">Architecture</option>
                    <option value="nature">Nature</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: Number(e.target.value),
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Order"
                  />
                </div>

                {/* Location */}
                <div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Location (optional)"
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    Mark as featured
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
