import { MENU_PLACEHOLDER_ICONS } from "../config/placeholderAssets";

const MAIN_MENU_BUTTON_BASE_STYLE = {
  position: "fixed",
  bottom: 22,
  left: "50%",
  transform: "translateX(-50%)",
  width: 148,
  height: 48,
  borderRadius: 8,
  fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  zIndex: 1200,
  boxShadow: "0 10px 28px rgba(0, 0, 0, 0.65)",
  transition: "all 0.15s ease",
};

export function FullScreenMenuCloseButton({ onClose, label = "✕ Fechar" }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fechar menu e voltar ao jogo"
      style={{
        ...MAIN_MENU_BUTTON_BASE_STYLE,
        background: "#C89B5C",
        border: "2px solid #EDE6D3",
        color: "#161D18",
      }}
    >
      {label}
    </button>
  );
}

export default function PlayerBottomMenu({
  isSubmenuOpen,
  onToggleSubmenu,
  onSelectMenu,
}) {
  const leftItems = [
    {
      key: "status",
      label: "Status",
      placeholder: MENU_PLACEHOLDER_ICONS.status,
    },
    {
      key: "inventory",
      label: "Inventário",
      placeholder: MENU_PLACEHOLDER_ICONS.inventory,
    },
  ];

  const rightItems = [
    {
      key: "statistics",
      label: "Estatísticas",
      placeholder: MENU_PLACEHOLDER_ICONS.statistics,
    },
    {
      key: "settings",
      label: "Configurações",
      placeholder: MENU_PLACEHOLDER_ICONS.settings,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 22,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        zIndex: 1100,
        pointerEvents: "none",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: isSubmenuOpen ? 1 : 0,
          transform: isSubmenuOpen ? "translateX(0)" : "translateX(24px)",
          pointerEvents: isSubmenuOpen ? "auto" : "none",
          transition: "all 0.18s ease",
        }}
      >
        {leftItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectMenu(item.key)}
            title={item.placeholder.title}
            style={{
              minWidth: 96,
              height: 46,
              padding: "6px 12px",
              background: "#18221B",
              border: "1px solid #C89B5C",
              borderRadius: 8,
              color: "#EDE6D3",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(0, 0, 0, 0.55)",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: "#C89B5C",
              }}
            >
              [{item.placeholder.shortLabel}]
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#EDE6D3",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleSubmenu}
        aria-expanded={isSubmenuOpen}
        style={{
          ...MAIN_MENU_BUTTON_BASE_STYLE,
          position: "relative",
          bottom: "auto",
          left: "auto",
          transform: "none",
          pointerEvents: "auto",
          background: isSubmenuOpen ? "#26332A" : "#C89B5C",
          border: isSubmenuOpen ? "2px solid #C89B5C" : "2px solid #EDE6D3",
          color: isSubmenuOpen ? "#EDE6D3" : "#161D18",
        }}
      >
        {isSubmenuOpen ? "▲ MENU" : "☰ MENU"}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: isSubmenuOpen ? 1 : 0,
          transform: isSubmenuOpen ? "translateX(0)" : "translateX(-24px)",
          pointerEvents: isSubmenuOpen ? "auto" : "none",
          transition: "all 0.18s ease",
        }}
      >
        {rightItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectMenu(item.key)}
            title={item.placeholder.title}
            style={{
              minWidth: 96,
              height: 46,
              padding: "6px 12px",
              background: "#18221B",
              border: "1px solid #C89B5C",
              borderRadius: 8,
              color: "#EDE6D3",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(0, 0, 0, 0.55)",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: "#C89B5C",
              }}
            >
              [{item.placeholder.shortLabel}]
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#EDE6D3",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
