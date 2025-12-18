"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const { showToast } = useToast();
  const [components] = useState<string[]>([
    "ProductTeaserCard",
    "AnimatedCardStack",
    "CatAccordion",
    "PhotoWall",
    "AboutPage",
  ]);
  const [assignments, setAssignments] = useState<ComponentAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state for new assignment
  const [selectedComponent, setSelectedComponent] = useState("");
  const [order, setOrder] = useState(0);
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAssignments();
    }
  }, [isOpen, photoId]);

  const loadAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/v1/photos/${photoId}/components`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setAssignments(data.data || []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedComponent) {
      showToast("Please select a component", "warning");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:8080/api/v1/component-photos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            componentName: selectedComponent,
            photoId,
            order,
            props: { caption, alt, link },
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Assignment failed");
      }

      // Reset form
      setSelectedComponent("");
      setOrder(0);
      setCaption("");
      setAlt("");
      setLink("");

      loadAssignments();
      onSuccess();
      showToast("Photo assigned successfully", "success");
    } catch (error: any) {
      showToast(`Assignment failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId: number) => {
    setDeleteId(assignmentId);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/v1/component-photos/${deleteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Remove failed");

      loadAssignments();
      onSuccess();
      showToast("Assignment removed successfully", "success");
    } catch (error) {
      showToast(`Remove failed: ${error}`, "error");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Remove Assignment"
        message="Are you sure you want to remove this assignment? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />

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
            {/* Current Assignments */}
            {assignments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Current Assignments
                </h3>
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {assignment.componentName}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Order: {assignment.order}
                          {assignment.props.caption &&
                            ` • Caption: ${assignment.props.caption}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign Form */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Assign to New Component
              </h3>

              <div className="space-y-4">
                {/* Component Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component
                  </label>
                  <select
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a component...</option>
                    {components.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Photo caption..."
                  />
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Alt text for accessibility..."
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleAssign}
                  disabled={loading || !selectedComponent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                  {loading ? "Assigning..." : "Assign to Component"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
