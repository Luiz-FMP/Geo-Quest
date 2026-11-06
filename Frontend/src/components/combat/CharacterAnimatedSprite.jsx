import { useEffect, useRef } from "react";
import { getCharacterConfig } from "../../config/characterAssets";

/**
 * Componente modular de Sprite Animado do Geo-Quest.
 * 
 * - Personagens com spritesheet (Amelia, Z): renderiza animações via Canvas com deltaTime e pixel art nítida.
 * - Personagens em refação (Benjamin, Miguel): renderiza o quadrado colorido original com seu badge.
 */
export default function CharacterAnimatedSprite({
  characterName = "Miguel",
  action = "battleIdle", // "battleIdle" | "mapIdle" | "run" | "attack" | "damage" | "idle"
  scale = 1.0,
  flipX = false,
  isDamaged = false,
  useProcedural = true,
  onAnimationComplete,
  style = {},
}) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({});
  const stateRef = useRef({
    currentFrameIndex: 0,
    timer: 0,
    lastTime: null,
    proceduralTime: 0,
    completedAction: null,
  });

  const charConfig = getCharacterConfig(characterName);

  // Mapeia sinônimos de ações
  const resolvedAction = (() => {
    if (action === "idle") {
      return charConfig.animations?.battleIdle ? "battleIdle" : "mapIdle";
    }
    return action;
  })();

  const animation =
    charConfig.animations?.[resolvedAction] ||
    charConfig.animations?.battleIdle ||
    charConfig.animations?.mapIdle ||
    null;

  // Carrega as imagens necessárias (spritesheet e/ou idleUrl)
  useEffect(() => {
    if (!charConfig.hasSprite) return;

    if (charConfig.sheetUrl && !imagesRef.current[charConfig.sheetUrl]) {
      const img = new Image();
      img.src = charConfig.sheetUrl;
      img.onload = () => {
        imagesRef.current[charConfig.sheetUrl] = img;
      };
    }

    if (charConfig.idleUrl && !imagesRef.current[charConfig.idleUrl]) {
      const imgIdle = new Image();
      imgIdle.src = charConfig.idleUrl;
      imgIdle.onload = () => {
        imagesRef.current[charConfig.idleUrl] = imgIdle;
      };
    }
  }, [charConfig.hasSprite, charConfig.sheetUrl, charConfig.idleUrl]);

  // Reseta o frame ao trocar de ação
  useEffect(() => {
    stateRef.current.currentFrameIndex = 0;
    stateRef.current.timer = 0;
    stateRef.current.completedAction = null;
  }, [resolvedAction]);

  // Game loop de animação baseado em requestAnimationFrame e deltaTime
  useEffect(() => {
    if (!charConfig.hasSprite || !animation) return;

    let animationFrameId;

    const render = (timestamp) => {
      if (!stateRef.current.lastTime) {
        stateRef.current.lastTime = timestamp;
      }

      const deltaTime = Math.min(
        (timestamp - stateRef.current.lastTime) / 1000,
        0.1
      );
      stateRef.current.lastTime = timestamp;

      // 1. Atualiza lógica de frames
      const frames = animation.frames || [];
      if (frames.length > 0) {
        stateRef.current.timer += deltaTime;
        stateRef.current.proceduralTime += deltaTime;

        const duration = animation.frameDuration || 0.15;
        if (stateRef.current.timer >= duration) {
          stateRef.current.timer -= duration;
          if (stateRef.current.currentFrameIndex + 1 < frames.length) {
            stateRef.current.currentFrameIndex += 1;
          } else if (animation.loop !== false) {
            stateRef.current.currentFrameIndex = 0;
          } else {
            // Animação sem loop completada (ex: ataque ou dano)
            if (stateRef.current.completedAction !== resolvedAction) {
              stateRef.current.completedAction = resolvedAction;
              onAnimationComplete?.();
            }
          }
        }
      }

      // 2. Renderiza no Canvas
      const canvas = canvasRef.current;
      const targetImgUrl = animation.useIdleImage
        ? charConfig.idleUrl
        : charConfig.sheetUrl;
      const activeImg = imagesRef.current[targetImgUrl];

      if (canvas && activeImg && frames.length > 0) {
        const ctx = canvas.getContext("2d");
        const frame = frames[stateRef.current.currentFrameIndex] || frames[0];

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ponto do solo na tela
        const groundX = canvas.width / 2;
        const groundY = canvas.height - 14;

        // Efeito procedural de respiração sutil apenas no idle
        let scaleX = 1.0;
        let scaleY = 1.0;
        let offsetY = 0;

        const isIdleAction =
          resolvedAction === "battleIdle" ||
          resolvedAction === "mapIdle" ||
          resolvedAction === "idle";

        if (useProcedural && isIdleAction) {
          const wave = Math.sin(stateRef.current.proceduralTime * 2.6);
          scaleY = 1.0 + wave * 0.015;
          scaleX = 1.0 - wave * 0.008;
          offsetY = wave * 1.2;
        }

        // Calcula a escala interna de renderização para caber no canvas
        // Normaliza altura alvo para ~180px na caixa do canvas
        const targetHeight = 180;
        const baseNormScale = targetHeight / Math.max(frame.h, 120);

        const drawW = Math.round(frame.w * baseNormScale * scaleX);
        const drawH = Math.round(frame.h * baseNormScale * scaleY);

        ctx.save();

        if (flipX) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        if (isDamaged) {
          ctx.filter =
            "brightness(1.5) drop-shadow(0 0 10px rgba(239, 68, 68, 0.85))";
        }

        const drawX = Math.round(groundX - drawW * (frame.anchorX ?? 0.5));
        const drawY = Math.round(
          groundY - drawH * (frame.anchorY ?? 1.0) + offsetY
        );

        ctx.drawImage(
          activeImg,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          drawX,
          drawY,
          drawW,
          drawH
        );

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    charConfig.hasSprite,
    charConfig.sheetUrl,
    charConfig.idleUrl,
    animation,
    resolvedAction,
    flipX,
    isDamaged,
    useProcedural,
    onAnimationComplete,
  ]);

  // Se o personagem não tiver spritesheet (Miguel ou Benjamin), exibe o quadrado original
  if (!charConfig.hasSprite) {
    const size = Math.round(64 * scale);
    return (
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          ...style,
        }}
      >
        <div
          title={charConfig.shapeLabel}
          style={{
            width: size,
            height: size,
            background: charConfig.color,
            border: `3px solid ${isDamaged ? "#EF4444" : charConfig.borderColor}`,
            boxShadow: isDamaged
              ? "0 0 20px rgba(239, 68, 68, 0.8)"
              : `0 0 18px ${charConfig.glow}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: Math.max(10, Math.round(11 * scale)),
            fontWeight: 700,
            color: "#FFFFFF",
            transform: isDamaged ? "scale(0.92)" : "scale(1)",
            transition: "transform 0.15s ease",
          }}
        >
          {charConfig.badgeText}
        </div>
      </div>
    );
  }

  // Personagens com spritesheet (Amelia, Z)
  const displayW = Math.round(180 * scale);
  const displayH = Math.round(210 * scale);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={280}
        style={{
          width: displayW,
          height: displayH,
          imageRendering: "pixelated",
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  );
}
