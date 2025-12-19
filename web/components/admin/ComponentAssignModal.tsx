"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiClient, API_ENDPOINTS } from "@/lib/api/client";
import { AssignmentList } from "./AssignmentList";
import { ComponentAssignForm } from "./ComponentAssignForm";

interface ComponentAssignment {
  id: number;
  componentName: string;
  order: number;
  props: {
    caption?: string;
    alt?: string;
    link?: string;
  };
}

interface ComponentAssignModalProps {
  photoId: number;
  photoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ComponentAssignModal({
  photoId,
  photoTitle,
  isOpen,
  onClose,
  onSuccess,
}: ComponentAssignModalProps) {
  const [assignments, setAssignments] = useState<ComponentAssignment[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadAssignments();
    }
  }, [isOpen, photoId]);

  const loadAssignments = async () => {
    try {
      const data = await apiClient.get<{ data: ComponentAssignment[] }>(
        API_ENDPOINTS.photoComponents(photoId)
      );
      setAssignments(data.data || []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    }
  };

  const handleSuccess = () => {
    loadAssignments();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assign to Components
            </h2>
            <p className="text-sm text-gray-600 mt-1">{photoTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <AssignmentList assignments={assignments} onUpdate={handleSuccess} />
          <ComponentAssignForm photoId={photoId} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
