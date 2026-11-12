export const PLACE_CATEGORY_ICON_PATHS = {
  "Entertainment and Recreation": "/sprites/map_icons/park_icon.png",
  Shopping: "/sprites/map_icons/store_icon.png",
  Lodging: "/sprites/map_icons/bed_icon.png",
  "Food and Drink": "/sprites/map_icons/restaurant_icon.png",
  Culture: "/sprites/map_icons/culture_icon.png",
  Sports: "/sprites/map_icons/gym_icon.png",

  Services: "/sprites/map_icons/gov_icon.png",
  Transportation: "/sprites/map_icons/bus_icon.png",
};

export const BOSS_ICON_PATH = "/sprites/map_icons/boss_icon.png";

export function getPlaceCategoryIconPath(category, isBossSpecial = false) {
  if (isBossSpecial) {
    return BOSS_ICON_PATH;
  }
  return PLACE_CATEGORY_ICON_PATHS[category] || null;
}
