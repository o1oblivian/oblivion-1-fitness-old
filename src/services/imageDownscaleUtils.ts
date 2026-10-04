export async function downscaleBase64IfNeeded(base64: string, maxDim = 1024, quality = 0.8): Promise<string> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return base64;
  return new Promise((resolve) => {
    const img = new Image();
    const clean = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        return resolve(base64.replace(/^data:image\/[a-z]+;base64,/, ''));
      }
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64.replace(/^data:image\/[a-z]+;base64,/, ''));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.replace(/^data:image\/[a-z]+;base64,/, ''));
    };
    img.onerror = () => resolve(base64.replace(/^data:image\/[a-z]+;base64,/, ''));
    img.src = clean;
  });
}
