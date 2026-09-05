// Component/ConfirmModal.tsx
"use client";
import { FC, useRef, useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  header?: string;
  type?: "success" | "warning" | "error";
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  dataTour?: string;
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  message,
  header,
  type = "success",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  dataTour,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) confirmButtonRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isOpen) {
        e.preventDefault();
        if (!confirmDisabled) onConfirm();
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel, confirmDisabled]);

  if (!isOpen) return null;

  const headerColor = {
    success: "bg-green-200 text-green-800",
    warning: "bg-yellow-200 text-yellow-800",
    error: "bg-red-200 text-red-800",
  }[type];

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* modal */}
      <div
        data-tour={dataTour}
        className="bg-white rounded-lg shadow-lg w-96 relative overflow-hidden z-[20001]"
        onClick={(e) => e.stopPropagation()}
      >
        {header && (
          <div className={`px-4 py-2 font-bold text-center ${headerColor}`}>
            {header}
          </div>
        )}

        <div className="p-4">
          <p className="text-center text-[15px]">{message}</p>

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded"
              onClick={onCancel}
            >
              لغو
            </button>
            <button
              ref={confirmButtonRef}
              className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded ${confirmDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              تایید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

