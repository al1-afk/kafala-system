import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

export const toast = {
  success: (msg: string) => sonnerToast.success(msg),
  error: (msg: string) => sonnerToast.error(msg),
  info: (msg: string) => sonnerToast.info(msg),
  warning: (msg: string) => sonnerToast.warning(msg),
  message: (msg: string) => sonnerToast(msg),
};

export function Toaster() {
  return (
    <SonnerToaster
      position="top-left"
      richColors
      closeButton
      dir="rtl"
      toastOptions={{
        style: {
          fontFamily: "Cairo, sans-serif",
          direction: "rtl",
          textAlign: "right",
        },
      }}
    />
  );
}
