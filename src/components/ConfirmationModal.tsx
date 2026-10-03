import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-800/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 40 }}
          transition={{ 
            type: "spring", 
            damping: 18, 
            stiffness: 400,
            mass: 0.8
          }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                type === 'danger' ? "bg-rose-50 text-rose-600 shadow-rose-100" :
                type === 'warning' ? "bg-amber-50 text-amber-600 shadow-amber-100" :
                "bg-blue-50 text-blue-600 shadow-blue-100"
              )}>
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              {message}
            </p>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs tracking-tight hover:bg-slate-200 transition-all active:scale-95"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 py-3 text-white rounded-xl font-bold text-xs tracking-tight transition-all active:scale-95 shadow-lg",
                  type === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" :
                  type === 'warning' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" :
                  "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
