"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface PhotoUploadProps {
  onUploadSuccess: () => void;
}

export function PhotoUpload({ onUploadSuccess }: PhotoUploadProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "landscape",
    location: "",
    isFeatured: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      showToast("Please select an image", "warning");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");

      // 1. Get upload token
      const tokenRes = await fetch(
        "http://localhost:8080/api/v1/storage/upload-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        }
      );

      if (!tokenRes.ok) {
        throw new Error("Failed to get upload token");
      }

      const { uploadUrl, fileUrl } = await tokenRes.json();

      // 2. Upload to MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      // 3. Save photo record
      const photoRes = await fetch("http://localhost:8080/api/v1/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: fileUrl,
        }),
      });

      if (!photoRes.ok) {
        throw new Error("Failed to save photo record");
      }

      showToast("Photo uploaded successfully!", "success");
      setPreview(null);
      setFormData({
        title: "",
        description: "",
        category: "landscape",
        location: "",
        isFeatured: false,
      });
      fileInput.value = "";
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      showToast(`Upload failed: ${error}`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Upload Photo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg"
              />
            ) : (
              <div className="py-8">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              required
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B5CCBE] focus:border-transparent outline-none"
            placeholder="e.g. Huangshan Sunrise"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B5CCBE] focus:border-transparent outline-none"
            placeholder="Photo description..."
            rows={3}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B5CCBE] focus:border-transparent outline-none"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="street">Street</option>
            <option value="architecture">Architecture</option>
            <option value="nature">Nature</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B5CCBE] focus:border-transparent outline-none"
            placeholder="e.g. Huangshan"
          />
        </div>

        {/* Featured */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            checked={formData.isFeatured}
            onChange={(e) =>
              setFormData({ ...formData, isFeatured: e.target.checked })
            }
            className="h-4 w-4 text-gray-700 focus:ring-[#B5CCBE] border-gray-300 rounded"
          />
          <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
            Mark as featured
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-gray-700 text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? "Uploading..." : "Upload Photo"}
        </button>
      </form>
    </div>
  );
}