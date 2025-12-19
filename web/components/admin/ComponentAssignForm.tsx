"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient, API_ENDPOINTS, ApiError } from "@/lib/api/client";

interface ComponentAssignFormProps {
  photoId: number;
  onSuccess: () => void;
}

interface FormState {
  selectedComponent: string;
  order: number;
  caption: string;
  alt: string;
  link: string;
}

const INITIAL_FORM_STATE: FormState = {
  selectedComponent: "",
  order: 0,
  caption: "",
  alt: "",
  link: "",
};

// 可配置的组件列表
const AVAILABLE_COMPONENTS = [
  "HeroSection",
  "ProductTeaserCard",
  "AnimatedCardStack",
  "CatAccordion",
  "PhotoWall",
  "AboutPage",
] as const;

export function ComponentAssignForm({
  photoId,
  onSuccess,
}: ComponentAssignFormProps) {
  const { showToast } = useToast();
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);

  const updateForm = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
  };

  const handleSubmit = async () => {
    if (!formState.selectedComponent) {
      showToast("Please select a component", "warning");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.componentPhotos, {
        componentName: formState.selectedComponent,
        photoId,
        order: formState.order,
        props: {
          caption: formState.caption,
          alt: formState.alt,
          link: formState.link,
        },
      });

      resetForm();
      onSuccess();
      showToast("Photo assigned successfully", "success");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Assignment failed";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            value={formState.selectedComponent}
            onChange={(e) => updateForm({ selectedComponent: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a component...</option>
            {AVAILABLE_COMPONENTS.map((name) => (
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
            value={formState.order}
            onChange={(e) => updateForm({ order: Number(e.target.value) })}
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
            value={formState.caption}
            onChange={(e) => updateForm({ caption: e.target.value })}
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
            value={formState.alt}
            onChange={(e) => updateForm({ alt: e.target.value })}
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
            value={formState.link}
            onChange={(e) => updateForm({ link: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://..."
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !formState.selectedComponent}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
          {loading ? "Assigning..." : "Assign to Component"}
        </button>
      </div>
    </div>
  );
}
