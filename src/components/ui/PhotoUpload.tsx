import { useRef, useState } from "react";
import { Camera, X, User, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { fileToCompressedBase64, getInitials } from "../../lib/image";
import { toast } from "./Toast";

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  fallbackName?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  shape?: "circle" | "square";
}

const sizes = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export function PhotoUpload({
  value,
  onChange,
  label,
  fallbackName,
  size = "md",
  disabled = false,
  className,
  shape = "circle",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة أكبر من 10 ميجابايت");
      return;
    }
    setLoading(true);
    try {
      const compressed = await fileToCompressedBase64(file);
      onChange(compressed);
      toast.success("تم رفع الصورة");
    } catch (err: any) {
      toast.error(err.message || "خطأ في رفع الصورة");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    toast.info("تم حذف الصورة");
  };

  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const initials = fallbackName ? getInitials(fallbackName) : null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      <div className="relative group">
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled || loading}
          className={cn(
            "relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-all",
            radiusClass,
            sizes[size],
            !disabled && !value && "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer",
            !disabled && value && "cursor-pointer",
            disabled && "opacity-70 cursor-not-allowed"
          )}
          aria-label={label || "رفع صورة"}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          ) : value ? (
            <img src={value} alt={label || "صورة"} className="w-full h-full object-cover" />
          ) : initials ? (
            <span className="text-xl font-bold text-slate-500 dark:text-slate-400">{initials}</span>
          ) : (
            <User className="w-7 h-7 text-slate-400" />
          )}
          {!disabled && (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity",
                radiusClass
              )}
            >
              <Camera className="w-6 h-6" />
            </span>
          )}
        </button>
        {value && !disabled && !loading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
            aria-label="حذف الصورة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleSelect}
        className="hidden"
      />
      {!disabled && !value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          إضافة صورة
        </button>
      )}
    </div>
  );
}

interface PhotoDisplayProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
  className?: string;
}

export function PhotoDisplay({
  src,
  name,
  size = "sm",
  shape = "circle",
  className,
}: PhotoDisplayProps) {
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const initials = name ? getInitials(name) : null;
  return (
    <div
      className={cn(
        "overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700",
        radiusClass,
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name || "صورة"} className="w-full h-full object-cover" />
      ) : initials ? (
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{initials}</span>
      ) : (
        <User className="w-5 h-5 text-slate-400" />
      )}
    </div>
  );
}
