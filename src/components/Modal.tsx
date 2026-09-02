import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReactNode } from 'react';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  isFullscreen?: boolean;
  noPadding?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, isFullscreen, noPadding }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className={cn(
              "fixed inset-0 m-auto w-full transition-all duration-300 overflow-hidden bg-white shadow-2xl z-[51] flex flex-col border border-slate-200",
              isFullscreen 
                ? "max-w-none max-h-none h-full rounded-none" 
                : "max-w-lg h-fit max-h-[90vh] rounded-xl",
              className
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={cn(
              "overflow-y-auto flex-1",
              !noPadding && "p-6"
            )}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
