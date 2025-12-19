"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiClient, API_ENDPOINTS, ApiError } from "@/lib/api/client";

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

interface AssignmentListProps {
  assignments: ComponentAssignment[];
  onUpdate: () => void;
}

export function AssignmentList({ assignments, onUpdate }: AssignmentListProps) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleRemove = (assignmentId: number) => {
    setDeleteId(assignmentId);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!deleteId) return;

    try {
      await apiClient.delete(API_ENDPOINTS.componentPhoto(deleteId));
      onUpdate();
      showToast("Assignment removed successfully", "success");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Remove failed";
      showToast(message, "error");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const cancelRemove = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  if (assignments.length === 0) {
    return null;
  }

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
        onCancel={cancelRemove}
      />

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
    </>
  );
}
