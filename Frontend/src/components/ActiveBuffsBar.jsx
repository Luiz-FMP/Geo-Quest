import { useEffect, useState } from "react";
import { getBuffPlaceholder } from "../config/placeholderAssets.js";
import {
  calcularSegundosRestantesBuff,
  filtrarBuffsAtivosUnicosPorAtributo,
  formatarContadorBuff,
  identificarAtributoBuff,
  obterExpiracaoBuffMs,
} from "../services/playerApi.js";

export default function ActiveBuffsBar({
  buffs = [],
  compact = false,
  onBuffExpired = null,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasAnyBuff = Array.isArray(buffs) && buffs.length > 0;

  useEffect(() => {
    if (!hasAnyBuff) return undefined;
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [hasAnyBuff]);

  useEffect(() => {
    if (!hasAnyBuff || typeof onBuffExpired !== "function") return;
    const anyJustExpired = buffs.some((b) => {
      if (!b || !b.ativo || !b.expiraEmUtc) return false;
      const expMs = obterExpiracaoBuffMs(b.expiraEmUtc);
      return Number.isFinite(expMs) && expMs <= nowMs;
    });
    if (anyJustExpired) {
      onBuffExpired();
    }
  }, [buffs, hasAnyBuff, nowMs, onBuffExpired]);

  const activeOrderedBuffs = filtrarBuffsAtivosUnicosPorAtributo(buffs, nowMs);
  if (activeOrderedBuffs.length === 0) {
    return null;
  }

  const iconSize = compact ? 30 : 38;
  const borderRadius = compact ? 7 : 9;

  return (
    <div
      className={compact ? "combat-active-buffs-bar" : "map-active-buffs-bar"}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: compact ? "6px" : "8px",
        pointerEvents: "auto",
      }}
    >
      {activeOrderedBuffs.map((buff) => {
        const attr = identificarAtributoBuff(buff);
        const visual = getBuffPlaceholder(buff.placeholderKey || attr);
        const remainingSeconds = calcularSegundosRestantesBuff(buff, nowMs);
        const isLastMinute = remainingSeconds <= 60;
        const timerColor = isLastMinute ? "#EF4444" : "#22C55E";

        return (
          <div
            key={buff.id || `${attr}-${buff.expiraEmUtc}`}
            className="active-buff-item"
            title={`${buff.nome || visual.label}: ${buff.descricao || ""}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: compact ? "2px" : "3px",
              userSelect: "none",
            }}
          >
            <div
              className="active-buff-icon-box"
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                borderRadius: `${borderRadius}px`,
                background: visual.bg || "rgba(15, 23, 42, 0.9)",
                border: `1.5px solid ${visual.border || visual.accent || "#38BDF8"}`,
                boxShadow: "0 3px 8px rgba(0, 0, 0, 0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: visual.accent || "#F8FAFC",
                backdropFilter: "blur(6px)",
              }}
            >
              <span
                style={{
                  fontSize: compact ? "0.78rem" : "0.95rem",
                  lineHeight: 1,
                }}
              >
                {visual.symbol}
              </span>
              <span
                style={{
                  fontSize: compact ? "0.48rem" : "0.56rem",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  marginTop: "1px",
                }}
              >
                {visual.code}
              </span>
            </div>

            <span
              className="active-buff-timer"
              style={{
                fontSize: compact ? "0.62rem" : "0.7rem",
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: timerColor,
                background: "rgba(9, 13, 22, 0.85)",
                padding: compact ? "1px 4px" : "1px 5px",
                borderRadius: "4px",
                border: `1px solid ${isLastMinute ? "rgba(239, 68, 68, 0.45)" : "rgba(34, 197, 94, 0.4)"}`,
                lineHeight: 1.15,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {formatarContadorBuff(remainingSeconds)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
