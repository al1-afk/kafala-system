export async function fileToCompressedBase64(file: File, maxSize = 400, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("الرجاء اختيار ملف صورة");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر تحميل الصورة"));
    image.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير مدعوم");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function getInitials(fullName: string): string {
  if (!fullName) return "؟";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
