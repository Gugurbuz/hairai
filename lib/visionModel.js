/**
 * lib/visionModel.js
 * Hybrid Approach: MediaPipe AI Segmentation + Heuristic Color Analysis
 */

import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

const resizeImageForProcessing = (img, targetWidth = 512, targetHeight = 512) => {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  return canvas;
};

const isSkinPixel = (r, g, b) => {
  const isSkinRGB = (r > 60) && (g > 40) && (b > 20) &&
                    ((Math.max(r, g, b) - Math.min(r, g, b)) > 10) &&
                    (Math.abs(r - g) > 10) &&
                    (r > g) && (r > b);

  const Cb = 128 - 0.168736*r - 0.331264*g + 0.5*b;
  const Cr = 128 + 0.5*r - 0.418688*g - 0.081312*b;
  const isSkinYCbCr = (Cb > 85 && Cb < 135) && (Cr > 135 && Cr < 180);

  return isSkinRGB || isSkinYCbCr;
};

export const processHairImage = async (photo) => {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = photo.preview;

    img.onload = async () => {
      try {
        const selfieSegmentation = new SelfieSegmentation({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        selfieSegmentation.setOptions({
          modelSelection: 1,
        });

        const width = 512;
        const height = 512;
        const inputCanvas = resizeImageForProcessing(img, width, height);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width; maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        const maskImgData = maskCtx.createImageData(width, height);

        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = width; heatCanvas.height = height;
        const heatCtx = heatCanvas.getContext('2d');
        const heatImgData = heatCtx.createImageData(width, height);

        await selfieSegmentation.onResults((results) => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width; tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');

          tempCtx.drawImage(results.segmentationMask, 0, 0, width, height);
          const aiMaskData = tempCtx.getImageData(0, 0, width, height).data;

          const originalCtx = inputCanvas.getContext('2d');
          const originalData = originalCtx.getImageData(0, 0, width, height).data;

          let hairPixelCount = 0;
          let scalpRegionPixelCount = 0;

          const cx = width / 2;
          const cy = height / 2;
          const type = (photo.type || 'front').toLowerCase();

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;

              const aiConfidence = aiMaskData[idx];

              if (aiConfidence > 100) {
                const r = originalData[idx];
                const g = originalData[idx + 1];
                const b = originalData[idx + 2];

                const nx = (x - cx) / (width / 2);
                const ny = (y - cy) / (height / 2);
                let isFaceExclusion = false;

                if (type.includes('front')) {
                   const fx = nx;
                   const fy = ny - 0.15;
                   if ((fx*fx)/(0.35*0.35) + (fy*fy)/(0.45*0.45) < 1) isFaceExclusion = true;
                }

                if (!isFaceExclusion) {
                  scalpRegionPixelCount++;

                  const isSkin = isSkinPixel(r, g, b);
                  const brightness = (r + g + b) / 3;

                  const isDark = brightness < 90;
                  const isLighterHair = brightness < 170 && !isSkin && y < height * 0.6;

                  if ((isDark || isLighterHair) && !isSkin) {
                    hairPixelCount++;

                    maskImgData.data[idx] = 0;
                    maskImgData.data[idx+1] = 100;
                    maskImgData.data[idx+2] = 255;
                    maskImgData.data[idx+3] = 160;

                    const density = 1 - (brightness / 255);
                    if (density > 0.6) {
                        heatImgData.data[idx] = 0; heatImgData.data[idx+1] = 255; heatImgData.data[idx+2] = 0; heatImgData.data[idx+3] = 160;
                    } else if (density > 0.35) {
                        heatImgData.data[idx] = 255; heatImgData.data[idx+1] = 255; heatImgData.data[idx+2] = 0; heatImgData.data[idx+3] = 160;
                    } else {
                        heatImgData.data[idx] = 255; heatImgData.data[idx+1] = 0; heatImgData.data[idx+2] = 0; heatImgData.data[idx+3] = 160;
                    }
                  }
                }
              }
            }
          }

          maskCtx.putImageData(maskImgData, 0, 0);
          heatCtx.putImageData(heatImgData, 0, 0);

          const validArea = scalpRegionPixelCount > 0 ? scalpRegionPixelCount : 1;
          const densityScore = Math.min(100, Math.round((hairPixelCount / validArea) * 100));

          resolve({
            ...photo,
            processed: {
              segmentationMask: maskCanvas.toDataURL('image/png'),
              densityHeatmap: heatCanvas.toDataURL('image/png'),
              densityScore: densityScore,
              coverageLabel: densityScore > 75 ? 'Excellent Density' : densityScore > 45 ? 'Moderate Thinning' : 'Advanced Loss',
            }
          });
        });

        await selfieSegmentation.send({ image: inputCanvas });

      } catch (e) {
        console.error("AI Model Error:", e);
        resolve(photo);
      }
    };

    img.onerror = (err) => reject(err);
  });
};
