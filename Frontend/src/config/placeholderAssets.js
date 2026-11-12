export const MENU_PLACEHOLDER_ICONS = {
  status: {
    symbol: "◈",
    shortLabel: "STS",
    title: "Status do Jogador",
  },
  inventory: {
    symbol: "▣",
    shortLabel: "INV",
    title: "Inventário e Equipamentos",
  },
  statistics: {
    symbol: "▤",
    shortLabel: "EST",
    title: "Estatísticas da Jornada",
  },
  settings: {
    symbol: "⚙",
    shortLabel: "CFG",
    title: "Configurações",
  },
};

export const CHARACTER_PLACEHOLDERS = {
  char_1: {
    id: 1,
    color: "#2563EB",
    borderColor: "#93C5FD",
    glow: "rgba(37, 99, 235, 0.55)",
    badgeText: "EXP-01",
    shapeLabel: "Quadrado Azul (Placeholder)",
  },
  char_2: {
    id: 2,
    color: "#10B981",
    borderColor: "#6EE7B7",
    glow: "rgba(16, 185, 129, 0.55)",
    badgeText: "CRT-02",
    shapeLabel: "Quadrado Esmeralda (Placeholder)",
  },
  char_3: {
    id: 3,
    color: "#D97706",
    borderColor: "#FCD34D",
    glow: "rgba(217, 119, 6, 0.55)",
    badgeText: "GRD-03",
    shapeLabel: "Quadrado Âmbar (Placeholder)",
  },
  char_4: {
    id: 4,
    color: "#60A5FA",
    borderColor: "#93C5FD",
    glow: "rgba(96, 165, 250, 0.55)",
    badgeText: "Z-04",
    shapeLabel: "Quadrado Tático (Placeholder)",
  },
};

export function getCharacterPlaceholder(placeholderKeyOrId) {
  if (typeof placeholderKeyOrId === "number") {
    return (
      CHARACTER_PLACEHOLDERS[`char_${placeholderKeyOrId}`] ||
      CHARACTER_PLACEHOLDERS.char_1
    );
  }
  return (
    CHARACTER_PLACEHOLDERS[placeholderKeyOrId] || CHARACTER_PLACEHOLDERS.char_1
  );
}

export const RARITY_VISUALS = {
  Comum: {
    color: "#9CA3AF",
    border: "#4B5563",
    bg: "rgba(156, 163, 175, 0.14)",
  },
  Incomum: {
    color: "#34D399",
    border: "#059669",
    bg: "rgba(52, 211, 153, 0.14)",
  },
  Raro: {
    color: "#38BDF8",
    border: "#0284C7",
    bg: "rgba(56, 189, 248, 0.16)",
  },
  Épico: {
    color: "#C084FC",
    border: "#9333EA",
    bg: "rgba(192, 132, 252, 0.16)",
  },
  Lendário: {
    color: "#FBBF24",
    border: "#D97706",
    bg: "rgba(251, 191, 36, 0.18)",
  },
};

export function getRarityVisual(raridade) {
  return RARITY_VISUALS[raridade] || RARITY_VISUALS.Comum;
}

export const ITEM_PLACEHOLDERS = {
  item_debug: {
    code: "DBG",
    symbol: "❖",
    accent: "#38BDF8",
  },
  item_placeholder: {
    code: "ITM",
    symbol: "◆",
    accent: "#C89B5C",
  },
};

export function getItemPlaceholder(placeholderKey) {
  return (
    ITEM_PLACEHOLDERS[placeholderKey] || ITEM_PLACEHOLDERS.item_placeholder
  );
}

export const EQUIPMENT_SLOT_PLACEHOLDERS = {
  Cabeca: { code: "CAB", label: "Cabeça", position: "side" },
  Superior: { code: "SUP", label: "Superior", position: "side" },
  Inferior: { code: "INF", label: "Inferior", position: "side" },
  Maos: { code: "MAO", label: "Mãos", position: "side" },
  Botas: { code: "BOT", label: "Botas", position: "side" },
  Acessorio: { code: "ACE", label: "Acessório", position: "side" },
  Arma: { code: "ARM", label: "Arma", position: "bottom" },
};

export const BUFF_PLACEHOLDERS = {
  buff_vida: {
    code: "VID",
    symbol: "♥",
    label: "Vida",
    accent: "#EF4444",
    border: "rgba(239, 68, 68, 0.65)",
    bg: "rgba(239, 68, 68, 0.18)",
  },
  buff_energia: {
    code: "ENE",
    symbol: "⚡",
    label: "Energia",
    accent: "#38BDF8",
    border: "rgba(56, 189, 248, 0.65)",
    bg: "rgba(56, 189, 248, 0.18)",
  },
  buff_dano: {
    code: "DAN",
    symbol: "⚔",
    label: "Dano",
    accent: "#F97316",
    border: "rgba(249, 115, 22, 0.65)",
    bg: "rgba(249, 115, 22, 0.18)",
  },
  buff_defesa: {
    code: "DEF",
    symbol: "🛡",
    label: "Defesa",
    accent: "#60A5FA",
    border: "rgba(96, 165, 250, 0.65)",
    bg: "rgba(96, 165, 250, 0.18)",
  },
  buff_velocidade: {
    code: "VEL",
    symbol: "➤",
    label: "Velocidade",
    accent: "#A855F7",
    border: "rgba(168, 85, 247, 0.65)",
    bg: "rgba(168, 85, 247, 0.18)",
  },
  buff_nada: {
    code: "---",
    symbol: "∅",
    label: "Nada",
    accent: "#94A3B8",
    border: "rgba(148, 163, 184, 0.45)",
    bg: "rgba(148, 163, 184, 0.14)",
  },
};

export function getBuffPlaceholder(placeholderKeyOrAttr) {
  const raw = String(placeholderKeyOrAttr || "").trim().toLowerCase();
  if (BUFF_PLACEHOLDERS[raw]) {
    return BUFF_PLACEHOLDERS[raw];
  }
  if (BUFF_PLACEHOLDERS[`buff_${raw}`]) {
    return BUFF_PLACEHOLDERS[`buff_${raw}`];
  }
  return BUFF_PLACEHOLDERS.buff_vida;
}
