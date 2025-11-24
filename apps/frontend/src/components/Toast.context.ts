import { createContext } from 'react';
import type { Toast, ToastType } from './Toast.types';

export interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
