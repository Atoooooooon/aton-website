"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, ArrowLeft } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  const handleChangePassword = () => {
    router.push("/admin/change-password");
  };

  const modules = [
    {
      title: "Photo Management",
      description: "Upload and manage your photography collection",
      icon: Camera,
      href: "/admin/photos",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with same style as photos page */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 -ml-1"
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Select a module to get started
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.href}
                onClick={() => router.push(module.href)}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-6 text-left"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4">
                  <Icon className="text-gray-700" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
