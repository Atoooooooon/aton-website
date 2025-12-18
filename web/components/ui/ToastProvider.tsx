"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { ToastContainer, type ToastProps, type ToastType } from "./Toast"

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((message: string, type: ToastType, duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
      onClose: (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      },
    }
    setToasts((prev) => [...prev, newToast])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
