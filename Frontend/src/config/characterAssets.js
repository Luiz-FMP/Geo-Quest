/**
 * Configuração central e extensível de personagens e animações de sprites do Geo-Quest.
 * 
 * Regra de Extensibilidade:
 * Quando novos spritesheets de Miguel ou Benjamin forem adicionados no futuro:
 * 1. Coloque a imagem do spritesheet em Frontend/public/sprites/
 * 2. Altere hasSprite para true e defina sheetUrl e os frames em animations.
 * Não é necessário alterar nenhum outro componente.
 */

export const CHARACTERS_CONFIG = {
  miguel: {
    id: 1,
    key: "miguel",
    name: "Miguel",
    title: "Explorador",
    description: "Forte e resistente, aguenta vários combates.",
    icon: "/sprites/miguel_icon.png",
    placeholderKey: "char_1",
    color: "#2563EB",
    borderColor: "#93C5FD",
    glow: "rgba(37, 99, 235, 0.55)",
    badgeText: "EXP-01",
    shapeLabel: "Quadrado Azul (Miguel)",
    hasSprite: false, // Em refação: usa fallback de quadrado original
    sheetUrl: null,
    animations: null,
  },
  amelia: {
    id: 2,
    key: "amelia",
    name: "Amélia",
    title: "Atiradora",
    description: "Frágil, mas causa muito dano.",
    icon: "/sprites/amelia_icon.png",
    placeholderKey: "char_2",
    color: "#EC4899",
    borderColor: "#F472B6",
    glow: "rgba(236, 72, 153, 0.55)",
    badgeText: "CRT-02",
    shapeLabel: "Amélia",
    hasSprite: true,
    sheetUrl: "/sprites/spritesheet_amelia.png",
    animations: {
      // Mapa parado: sprite de frente
      mapIdle: {
        frameDuration: 0.3,
        loop: true,
        frames: [
          { x: 504, y: 367, w: 201, h: 276, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Batalha parada: sprite de lado, virada para a direita (invertida para olhar em direção aos inimigos)
      battleIdle: {
        frameDuration: 0.3,
        loop: true,
        flipX: true,
        frames: [
          { x: 736, y: 367, w: 200, h: 278, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Corrida no mapa (4 frames) - orientação invertida para caminhar voltada para o sentido do movimento
      run: {
        frameDuration: 0.13,
        loop: true,
        flipX: true,
        frames: [
          { x: 5, y: 723, w: 157, h: 206, anchorX: 0.5, anchorY: 1.0 },
          { x: 160, y: 725, w: 130, h: 204, anchorX: 0.5, anchorY: 1.0 },
          { x: 290, y: 723, w: 133, h: 206, anchorX: 0.5, anchorY: 1.0 },
          { x: 424, y: 724, w: 144, h: 207, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Ataque em combate (3 frames)
      attack: {
        frameDuration: 0.12,
        loop: false,
        frames: [
          { x: 622, y: 725, w: 138, h: 209, anchorX: 0.5, anchorY: 1.0 },
          { x: 760, y: 725, w: 120, h: 209, anchorX: 0.5, anchorY: 1.0 },
          { x: 880, y: 732, w: 202, h: 202, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Dano recebido (4 frames)
      damage: {
        frameDuration: 0.11,
        loop: false,
        frames: [
          { x: 1102, y: 754, w: 106, h: 181, anchorX: 0.5, anchorY: 1.0 },
          { x: 1208, y: 735, w: 98, h: 202, anchorX: 0.5, anchorY: 1.0 },
          { x: 1306, y: 749, w: 94, h: 186, anchorX: 0.5, anchorY: 1.0 },
          { x: 1400, y: 717, w: 111, h: 219, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
    },
  },
  benjamin: {
    id: 3,
    key: "benjamin",
    name: "Benjamin",
    title: "Guardião",
    description: "Resistente e ágil, consegue disparar vários golpes.",
    icon: "/sprites/benjamin_icon.png",
    placeholderKey: "char_3",
    color: "#D97706",
    borderColor: "#FCD34D",
    glow: "rgba(217, 119, 6, 0.55)",
    badgeText: "GRD-03",
    shapeLabel: "Quadrado Âmbar (Benjamin)",
    hasSprite: false, // Em refação: usa fallback de quadrado original
    sheetUrl: null,
    animations: null,
  },
  z: {
    id: 4,
    key: "z",
    name: "Z",
    title: "Tático",
    description: "Controle de área, explosões em área.",
    icon: "/sprites/z_icon.png",
    placeholderKey: "char_4",
    color: "#60A5FA",
    borderColor: "#93C5FD",
    glow: "rgba(96, 165, 250, 0.55)",
    badgeText: "Z-04",
    shapeLabel: "Z",
    hasSprite: true,
    sheetUrl: "/sprites/spritesheet_z.png",
    idleUrl: "/sprites/sprite_z_idle.png",
    animations: {
      // Mapa parado: usa sprite_z_idle de frente
      mapIdle: {
        frameDuration: 0.3,
        loop: true,
        useIdleImage: true,
        frames: [
          { x: 94, y: 84, w: 1036, h: 1769, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Batalha parada: usa sprite_z_idle de frente
      battleIdle: {
        frameDuration: 0.3,
        loop: true,
        useIdleImage: true,
        frames: [
          { x: 94, y: 84, w: 1036, h: 1769, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Corrida no mapa (linha 1: 6 frames)
      run: {
        frameDuration: 0.11,
        loop: true,
        frames: [
          { x: 70, y: 31, w: 203, h: 280, anchorX: 0.5, anchorY: 1.0 },
          { x: 333, y: 31, w: 178, h: 283, anchorX: 0.5, anchorY: 1.0 },
          { x: 565, y: 29, w: 182, h: 285, anchorX: 0.5, anchorY: 1.0 },
          { x: 810, y: 30, w: 207, h: 282, anchorX: 0.5, anchorY: 1.0 },
          { x: 1059, y: 30, w: 194, h: 271, anchorX: 0.5, anchorY: 1.0 },
          { x: 1324, y: 33, w: 163, h: 282, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Ataque em combate (linha 2: 4 frames jogando granada)
      attack: {
        frameDuration: 0.13,
        loop: false,
        frames: [
          { x: 150, y: 370, w: 259, h: 267, anchorX: 0.5, anchorY: 1.0 },
          { x: 444, y: 370, w: 274, h: 263, anchorX: 0.5, anchorY: 1.0 },
          { x: 774, y: 367, w: 308, h: 274, anchorX: 0.5, anchorY: 1.0 },
          { x: 1086, y: 368, w: 265, h: 273, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
      // Dano recebido (linha 3: 2 frames)
      damage: {
        frameDuration: 0.14,
        loop: false,
        frames: [
          { x: 555, y: 692, w: 191, h: 291, anchorX: 0.5, anchorY: 1.0 },
          { x: 821, y: 737, w: 173, h: 235, anchorX: 0.5, anchorY: 1.0 },
        ],
      },
    },
  },
};

export const ORDERED_CHARACTERS = [
  CHARACTERS_CONFIG.miguel,
  CHARACTERS_CONFIG.amelia,
  CHARACTERS_CONFIG.benjamin,
  CHARACTERS_CONFIG.z,
];

export function normalizeCharacterKey(identifier) {
  if (!identifier) return "miguel";
  if (typeof identifier === "number") {
    if (identifier === 1) return "miguel";
    if (identifier === 2) return "amelia";
    if (identifier === 3) return "benjamin";
    if (identifier === 4) return "z";
  }
  const str = String(identifier).toLowerCase().trim();
  if (str.includes("amélia") || str.includes("amelia") || str === "char_2") return "amelia";
  if (str.includes("benjamin") || str === "char_3") return "benjamin";
  if (str === "z" || str.includes("char_4")) return "z";
  if (str.includes("miguel") || str === "char_1") return "miguel";
  return "miguel";
}

export function getCharacterConfig(identifier) {
  const key = normalizeCharacterKey(identifier);
  return CHARACTERS_CONFIG[key] || CHARACTERS_CONFIG.miguel;
}
