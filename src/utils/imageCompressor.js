/**
 * Utility to compress base64 image data URLs before saving to state/globalThis.appStorage.
 * Scales down large photos/attachments to maximum dimensions and compresses JPEG quality.
 */
export function compressImageDataUrl(dataUrl, maxDim = 800, quality = 0.7) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return resolve(dataUrl);
    }
    if (dataUrl.startsWith("data:image/svg+xml")) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width <= maxDim && height <= maxDim && dataUrl.length < 150000) {
        return resolve(dataUrl);
      }
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}

export const compressAndResizeImage = async (imageInput, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = "image/jpeg",
  } = options;
  let objectUrl = "";
  let imageSource = imageInput;

  if (imageInput instanceof Blob || imageInput instanceof File) {
    objectUrl = URL.createObjectURL(imageInput);
    imageSource = objectUrl;
  } else if (imageInput instanceof ArrayBuffer) {
    objectUrl = URL.createObjectURL(new Blob([imageInput]));
    imageSource = objectUrl;
  }

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.crossOrigin = "anonymous";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Gagal membaca file gambar"));
      element.src = imageSource;
    });
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (mimeType === "image/jpeg") {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("Kompresi canvas gagal")),
      mimeType,
      quality,
    ));
    return { bytes: await blob.arrayBuffer(), contentType: mimeType, width, height };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};
