import React from "react";
import { Dialog, DialogFooter } from "./Dialog";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "هل أنت متأكد؟",
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${variant === "danger" ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
