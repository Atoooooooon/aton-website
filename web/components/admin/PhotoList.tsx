"use client";

import { useState } from "react";
import { Trash2, Star, Grid, Eye, EyeOff, GripVertical } from "lucide-react";
import { ComponentAssignModal } from "./ComponentAssignModal";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiClient, API_ENDPOINTS, ApiError } from "@/lib/api/client";
import type { Photo } from "@/lib/types/photo";

interface PhotoListProps {
  photos: Photo[];
  onUpdate: () => void;
}

export function PhotoList({ photos, onUpdate }: PhotoListProps) {
  const { showToast } = useToast();
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    photoId: number;
    photoTitle: string;
  }>({ isOpen: false, photoId: 0, photoTitle: "" });

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await apiClient.delete(API_ENDPOINTS.photo(deleteId));
      showToast("Photo deleted successfully", "success");
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      const message = error instanceof ApiError ? error.message : "Delete failed";
      showToast(message, "error");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handlePublishToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";

    try {
      await apiClient.put(API_ENDPOINTS.photo(id), { status: newStatus });
      showToast(
        `Photo ${newStatus === "published" ? "published" : "unpublished"} successfully`,
        "success"
      );
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      const message = error instanceof ApiError ? error.message : "Update failed";
      showToast(message, "error");
    }
  };

  const handleDragStart = (e: React.DragEvent, photoId: number) => {
    setDraggedId(photoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetPhotoId: number) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetPhotoId) {
      setDraggedId(null);
      return;
    }

    const draggedPhoto = photos.find((p) => p.id === draggedId);
    const targetPhoto = photos.find((p) => p.id === targetPhotoId);

    if (!draggedPhoto || !targetPhoto) {
      setDraggedId(null);
      return;
    }

    try {
      // Swap display orders
      await Promise.all([
        apiClient.put(API_ENDPOINTS.photo(draggedId), { displayOrder: targetPhoto.displayOrder }),
        apiClient.put(API_ENDPOINTS.photo(targetPhotoId), { displayOrder: draggedPhoto.displayOrder }),
      ]);

      showToast("Photo order updated successfully", "success");
      onUpdate();
    } catch (error) {
      console.error("Reorder error:", error);
      const message = error instanceof ApiError ? error.message : "Reorder failed";
      showToast(message, "error");
    } finally {
      setDraggedId(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No photos yet. Upload your first photo!</p>
      </div>
    );
  }

  // Sort photos by displayOrder
  const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This will also remove all component assignments. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Photo Gallery</h2>
            <p className="text-sm text-gray-500 mt-1">
              Drag photos to reorder • {photos.length} total
            </p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, photo.id)}
              className={`group relative bg-white border-2 rounded-lg overflow-hidden transition-all cursor-move hover:shadow-lg ${
                draggedId === photo.id
                  ? "opacity-50 border-blue-400"
                  : photo.status === "published"
                  ? "border-green-200"
                  : "border-gray-200"
              }`}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-600" />
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 right-2 z-10">
                {photo.status === "published" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <Eye className="w-3 h-3" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    <EyeOff className="w-3 h-3" />
                    Draft
                  </span>
                )}
              </div>

              {/* Image */}
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">
                    {photo.title}
                    {photo.isFeatured && (
                      <Star className="inline w-3 h-3 ml-1 text-yellow-500 fill-yellow-500" />
                    )}
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    #{photo.displayOrder}
                  </span>
                </div>

                {photo.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {photo.description}
                  </p>
                )}

                <div className="flex items-center gap-1 mb-3">
                  {photo.category && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {photo.category}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setAssignModal({
                        isOpen: true,
                        photoId: photo.id,
                        photoTitle: photo.title,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    title="Assign to Components"
                  >
                    <Grid className="w-3 h-3" />
                    Assign
                  </button>

                  <button
                    onClick={() => handlePublishToggle(photo.id, photo.status)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
                      photo.status === "published"
                        ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {photo.status === "published" ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Publish
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Assign Modal */}
      <ComponentAssignModal
        photoId={assignModal.photoId}
        photoTitle={assignModal.photoTitle}
        isOpen={assignModal.isOpen}
        onClose={() =>
          setAssignModal({ isOpen: false, photoId: 0, photoTitle: "" })
        }
        onSuccess={onUpdate}
      />
    </>
  );
}
