import { getCharacterConfig } from "../config/characterAssets";

const spriteCache = new Map();

function renderFrameToDataUrl(img, frame, flipX = false, targetSize = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(
    targetSize / 2,
    targetSize - 5,
    Math.round(targetSize * 0.28),
    Math.max(3, Math.round(targetSize * 0.05)),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const maxDim = Math.max(frame.w, frame.h, 1);
  const drawScale = (targetSize - 8) / maxDim;
  const drawW = Math.round(frame.w * drawScale);
  const drawH = Math.round(frame.h * drawScale);

  const groundX = targetSize / 2;
  const groundY = targetSize - 5;

  ctx.save();

  if (flipX) {
    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
  }

  const drawX = Math.round(groundX - drawW * (frame.anchorX ?? 0.5));
  const drawY = Math.round(groundY - drawH * (frame.anchorY ?? 1.0));

  ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, drawX, drawY, drawW, drawH);

  ctx.restore();

  return canvas.toDataURL("image/png");
}

export async function precomputePlayerMarkerFrames(characterName) {
  const config = getCharacterConfig(characterName);
  if (!config.hasSprite) return null;

  if (spriteCache.has(config.key)) {
    return spriteCache.get(config.key);
  }

  const result = {
    idle: "",
    runRight: [],
    runLeft: [],
  };

  const loadImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  try {
    let sheetImg = null;
    let idleImg = null;

    if (config.sheetUrl) {
      sheetImg = await loadImage(config.sheetUrl);
    }
    if (config.idleUrl) {
      idleImg = await loadImage(config.idleUrl);
    } else {
      idleImg = sheetImg;
    }

    const idleAnim = config.animations?.mapIdle;
    if (idleAnim && idleAnim.frames?.length > 0) {
      const sourceImg = idleAnim.useIdleImage ? idleImg : sheetImg;
      result.idle = renderFrameToDataUrl(sourceImg, idleAnim.frames[0], false);
    }

    const runAnim = config.animations?.run;
    if (runAnim && runAnim.frames?.length > 0 && sheetImg) {
      const invertRun = Boolean(runAnim.flipX);
      for (const frame of runAnim.frames) {
        result.runRight.push(
          renderFrameToDataUrl(sheetImg, frame, invertRun ? true : false)
        );
        result.runLeft.push(
          renderFrameToDataUrl(sheetImg, frame, invertRun ? false : true)
        );
      }
    }

    spriteCache.set(config.key, result);
    return result;
  } catch (err) {
    console.warn("Falha ao pré-calcular frames do marcador do mapa:", err);
    return null;
  }
}
