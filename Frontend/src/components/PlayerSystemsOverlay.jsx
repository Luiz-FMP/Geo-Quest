import { useState } from "react";
import PlayerBottomMenu from "./PlayerBottomMenu";
import PlayerInventoryModal from "./menus/PlayerInventoryModal";
import PlayerSettingsModal from "./menus/PlayerSettingsModal";
import PlayerStatsModal from "./menus/PlayerStatsModal";
import PlayerStatusModal from "./menus/PlayerStatusModal";

export default function PlayerSystemsOverlay({
  playerState,
  coords,
  onUpdateName,
  onChangeCharacter,
  onUpdatePlayerHp,
  onMoveItem,
  onDeleteItem,
  onEquipItem,
  onUnequipItem,
  onSpawnDebugItem,
  onApplyDebugCoords,
}) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // "status" | "inventory" | "statistics" | "settings" | null

  function handleSelectMenu(menuKey) {
    setIsSubmenuOpen(false);
    setActiveMenu(menuKey);
  }

  function handleCloseMenu() {
    setActiveMenu(null);
  }

  return (
    <>
      {!activeMenu && (
        <PlayerBottomMenu
          isSubmenuOpen={isSubmenuOpen}
          onToggleSubmenu={() => setIsSubmenuOpen((prev) => !prev)}
          onSelectMenu={handleSelectMenu}
        />
      )}

      {activeMenu === "status" && (
        <PlayerStatusModal
          playerState={playerState}
          coords={coords}
          onUpdateName={onUpdateName}
          onChangeCharacter={onChangeCharacter}
          onClose={handleCloseMenu}
        />
      )}

      {activeMenu === "inventory" && (
        <PlayerInventoryModal
          playerState={playerState}
          onMoveItem={onMoveItem}
          onDeleteItem={onDeleteItem}
          onEquipItem={onEquipItem}
          onUnequipItem={onUnequipItem}
          onSpawnDebugItem={onSpawnDebugItem}
          onClose={handleCloseMenu}
        />
      )}

      {activeMenu === "statistics" && (
        <PlayerStatsModal
          playerState={playerState}
          onClose={handleCloseMenu}
        />
      )}

      {activeMenu === "settings" && (
        <PlayerSettingsModal
          playerState={playerState}
          onUpdatePlayerHp={onUpdatePlayerHp}
          onApplyDebugCoords={onApplyDebugCoords}
          onClose={handleCloseMenu}
        />
      )}
    </>
  );
}
