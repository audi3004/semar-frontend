/**
 * Utility to compress base64 image data URLs before saving to state/localStorage.
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
