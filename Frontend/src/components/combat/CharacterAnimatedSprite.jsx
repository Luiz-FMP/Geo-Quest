import React, { useEffect, useRef } from "react";

/**
 * Definições de frames calibradas a partir dos sprite sheets transparentes (500x500).
 * Espelha fielmente a arquitetura das classes C# (Animation, SpriteFrame, Animator).
 */
const CHARACTER_CONFIGS = {
  miguel: {
    sheetUrl: "/sprites/sprite_sheet_miguel.png",
    idle: {
      frameDuration: 0.22,
      isPingPong: true,
      isLooping: true,
      frames: [
        { x: 11, y: 290, width: 55, height: 66, anchorX: 0.5, anchorY: 1.0 },
        { x: 65, y: 291, width: 48, height: 65, anchorX: 0.5, anchorY: 1.0 },
        { x: 110, y: 291, width: 57, height: 65, anchorX: 0.5, anchorY: 1.0 },
        { x: 165, y: 261, width: 57, height: 95, anchorX: 0.5, anchorY: 1.0 },
      ],
    },
  },
  amelia: {
    sheetUrl: "/sprites/sprite_sheet_amelia.png",
    idle: {
      frameDuration: 0.22,
      isPingPong: true,
      isLooping: true,
      frames: [
        { x: 10, y: 270, width: 56, height: 86, anchorX: 0.5, anchorY: 1.0 },
        { x: 60, y: 270, width: 56, height: 86, anchorX: 0.5, anchorY: 1.0 },
        { x: 110, y: 270, width: 61, height: 86, anchorX: 0.5, anchorY: 1.0 },
        { x: 165, y: 260, width: 65, height: 96, anchorX: 0.5, anchorY: 1.0 },
      ],
    },
  },
  benjamin: {
    sheetUrl: "/sprites/sprite_sheet_benjamin.png",
    idle: {
      frameDuration: 0.22,
      isPingPong: true,
      isLooping: true,
      frames: [
        { x: 11, y: 264, width: 55, height: 90, anchorX: 0.5, anchorY: 1.0 },
        { x: 60, y: 264, width: 56, height: 90, anchorX: 0.5, anchorY: 1.0 },
        { x: 110, y: 264, width: 61, height: 90, anchorX: 0.5, anchorY: 1.0 },
        { x: 165, y: 264, width: 66, height: 90, anchorX: 0.5, anchorY: 1.0 },
      ],
    },
  },
  z: {
    sheetUrl: "/sprites/sprite_sheet_z.png",
    idle: {
      frameDuration: 0.22,
      isPingPong: true,
      isLooping: true,
      frames: [
        { x: 10, y: 267, width: 56, height: 85, anchorX: 0.5, anchorY: 1.0 },
        { x: 60, y: 268, width: 56, height: 88, anchorX: 0.5, anchorY: 1.0 },
        { x: 110, y: 267, width: 61, height: 89, anchorX: 0.5, anchorY: 1.0 },
        { x: 165, y: 268, width: 66, height: 84, anchorX: 0.5, anchorY: 1.0 },
      ],
    },
  },
};

function normalizeName(name) {
  if (!name) return "miguel";
  const lower = name.toLowerCase().trim();
  if (lower.includes("amélia") || lower.includes("amelia")) return "amelia";
  if (lower.includes("benjamin")) return "benjamin";
  if (lower.includes("z")) return "z";
  return "miguel";
}

/**
 * Componente de animação 2D com Canvas, deltaTime e âncora nos pés.
 */
export default function CharacterAnimatedSprite({
  characterName = "Miguel",
  action = "idle",
  scale = 1.6,
  isDamaged = false,
  useProcedural = true,
  style = {},
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const stateRef = useRef({
    currentFrameIndex: 0,
    timer: 0,
    pingPongDirection: 1,
    lastTime: null,
    proceduralTime: 0,
  });

  const charKey = normalizeName(characterName);
  const config = CHARACTER_CONFIGS[charKey] || CHARACTER_CONFIGS.miguel;
  const currentAnimation = config[action] || config.idle;

  // Carrega a imagem do sprite sheet
  useEffect(() => {
    const img = new Image();
    img.src = config.sheetUrl;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [config.sheetUrl]);

  // Game loop de animação baseado em deltaTime real
  useEffect(() => {
    let animationFrameId;

    const render = (timestamp) => {
      if (!stateRef.current.lastTime) {
        stateRef.current.lastTime = timestamp;
      }

      // DeltaTime em segundos (independente de monitor 60Hz, 144Hz, etc.)
      const deltaTime = Math.min((timestamp - stateRef.current.lastTime) / 1000, 0.1);
      stateRef.current.lastTime = timestamp;

      // 1. Atualiza lógica do Animator
      const anim = currentAnimation;
      if (anim && anim.frames.length > 0) {
        stateRef.current.timer += deltaTime;
        stateRef.current.proceduralTime += deltaTime;

        while (stateRef.current.timer >= anim.frameDuration) {
          stateRef.current.timer -= anim.frameDuration;

          if (anim.isPingPong) {
            let nextIndex = stateRef.current.currentFrameIndex + stateRef.current.pingPongDirection;
            if (nextIndex >= anim.frames.length) {
              stateRef.current.pingPongDirection = -1;
              stateRef.current.currentFrameIndex = Math.max(0, anim.frames.length - 2);
            } else if (nextIndex < 0) {
              stateRef.current.pingPongDirection = 1;
              stateRef.current.currentFrameIndex = Math.min(1, anim.frames.length - 1);
            } else {
              stateRef.current.currentFrameIndex = nextIndex;
            }
          } else {
            stateRef.current.currentFrameIndex =
              (stateRef.current.currentFrameIndex + 1) % anim.frames.length;
          }
        }
      }

      // 2. Renderiza no Canvas
      const canvas = canvasRef.current;
      if (canvas && imageRef.current && anim.frames.length > 0) {
        const ctx = canvas.getContext("2d");
        const frame = anim.frames[stateRef.current.currentFrameIndex] || anim.frames[0];

        // Garante nitidez absoluta da pixel art (sem borrão)
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Limpa o frame anterior
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ponto do solo na tela (chão fixo perto da base do canvas)
        const groundX = canvas.width / 2;
        const groundY = canvas.height - 12;

        // Cálculo procedural (respiração sutil)
        let scaleX = scale;
        let scaleY = scale;
        let offsetY = 0;

        if (useProcedural) {
          const wave = Math.sin(stateRef.current.proceduralTime * 2.5);
          scaleY = scale * (1.0 + wave * 0.015);
          scaleX = scale * (1.0 - wave * 0.008);
          offsetY = wave * 1.0;
        }

        // Âncora nos pés: fixa os sapatos no solo mesmo com frames de alturas distintas
        const drawX = Math.floor(groundX - frame.width * scaleX * frame.anchorX);
        const drawY = Math.floor(groundY - frame.height * scaleY * frame.anchorY + offsetY);
        const drawW = Math.floor(frame.width * scaleX);
        const drawH = Math.floor(frame.height * scaleY);

        ctx.save();

        // Se estiver sob efeito de dano, aplica coloração de flash avermelhado
        if (isDamaged) {
          ctx.filter = "brightness(1.4) drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))";
        }

        ctx.drawImage(
          imageRef.current,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
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
  }, [currentAnimation, scale, isDamaged, useProcedural]);

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
        width={140}
        height={175}
        style={{
          imageRendering: "pixelated",
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  );
}

