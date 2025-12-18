"use client";

import { Trash2, Star } from "lucide-react";

interface Photo {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
  isFeatured: boolean;
  status: string;
  createdAt: string;
}

interface PhotoListProps {
  photos: Photo[];
  onUpdate: () => void;
}

export function PhotoList({ photos, onUpdate }: PhotoListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/v1/photos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      alert("Deleted successfully!");
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Delete failed: ${error}`);
    }
  };

  const handlePublish = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/v1/photos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      alert(`Update failed: ${error}`);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">
          No photos yet. Upload your first photo!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Photo Gallery
        </h2>
        <div className="space-y-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
            >
              {/* Thumbnail */}
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-24 h-24 object-cover rounded-lg"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {photo.title}
                      {photo.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {photo.description || "No description"}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>Category: {photo.category}</span>
                      {photo.location && <span>Location: {photo.location}</span>}
                      <span
                        className={`px-2 py-0.5 rounded ${
                          photo.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {photo.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublish(photo.id, photo.status)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        photo.status === "published"
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      } transition-colors`}
                    >
                      {photo.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}