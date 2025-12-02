import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import type { Photo } from '../types';

const resizeImage = (img: HTMLImageElement, size: number = 512): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
};

const isSkinPixel = (r: number, g: number, b: number): boolean => {
  const isSkinRGB = r > 60 && g > 40 && b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 10 &&
    Math.abs(r - g) > 10 && r > g && r > b;

  const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const isSkinYCbCr = Cb > 85 && Cb < 135 && Cr > 135 && Cr < 180;

  return isSkinRGB || isSkinYCbCr;
};

export const processHairPhoto = async (photo: Photo): Promise<Photo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.preview;

    img.onload = async () => {
      try {
        const segmentation = new SelfieSegmentation({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        segmentation.setOptions({ modelSelection: 1 });

        const size = 512;
        const inputCanvas = resizeImage(img, size);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d')!;
        const maskData = maskCtx.createImageData(size, size);

        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = size;
        heatCanvas.height = size;
        const heatCtx = heatCanvas.getContext('2d')!;
        const heatData = heatCtx.createImageData(size, size);

        segmentation.onResults((results) => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = size;
          tempCanvas.height = size;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(results.segmentationMask, 0, 0, size, size);
          const aiMask = tempCtx.getImageData(0, 0, size, size).data;

          const originalCtx = inputCanvas.getContext('2d')!;
          const originalPixels = originalCtx.getImageData(0, 0, size, size).data;

          let hairCount = 0;
          let scalpCount = 0;

          const cx = size / 2;
          const cy = size / 2;
          const isFrontView = photo.angle === 'front';

          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              const i = (y * size + x) * 4;
              const aiConfidence = aiMask[i];

              if (aiConfidence > 100) {
                const r = originalPixels[i];
                const g = originalPixels[i + 1];
                const b = originalPixels[i + 2];

                let excludeFace = false;
                if (isFrontView) {
                  const nx = (x - cx) / (size / 2);
                  const ny = (y - cy) / (size / 2) - 0.15;
                  excludeFace = (nx * nx) / 0.1225 + (ny * ny) / 0.2025 < 1;
                }

                if (!excludeFace) {
                  scalpCount++;
                  const brightness = (r + g + b) / 3;
                  const isSkin = isSkinPixel(r, g, b);
                  const isDarkHair = brightness < 90;
                  const isLightHair = brightness < 170 && !isSkin && y < size * 0.6;

                  if ((isDarkHair || isLightHair) && !isSkin) {
                    hairCount++;

                    maskData.data[i] = 0;
                    maskData.data[i + 1] = 100;
                    maskData.data[i + 2] = 255;
                    maskData.data[i + 3] = 180;

                    const density = 1 - brightness / 255;
                    if (density > 0.6) {
                      heatData.data[i] = 0;
                      heatData.data[i + 1] = 255;
                      heatData.data[i + 2] = 0;
                    } else if (density > 0.35) {
                      heatData.data[i] = 255;
                      heatData.data[i + 1] = 255;
                      heatData.data[i + 2] = 0;
                    } else {
                      heatData.data[i] = 255;
                      heatData.data[i + 1] = 0;
                      heatData.data[i + 2] = 0;
                    }
                    heatData.data[i + 3] = 180;
                  }
                }
              }
            }
          }

          maskCtx.putImageData(maskData, 0, 0);
          heatCtx.putImageData(heatData, 0, 0);

          const score = scalpCount > 0 ? Math.min(100, Math.round((hairCount / scalpCount) * 100)) : 0;

          resolve({
            ...photo,
            processed: {
              densityScore: score,
              segmentationMask: maskCanvas.toDataURL('image/png'),
              densityHeatmap: heatCanvas.toDataURL('image/png'),
            },
          });
        });

        segmentation.send({ image: inputCanvas });
      } catch (error) {
        console.error('AI processing error:', error);
        resolve(photo);
      }
    };

    img.onerror = reject;
  });
};
