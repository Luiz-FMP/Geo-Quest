/**
 * Mapeamento de ícones de categorias de Places para os marcadores do mapa.
 * Baseado estritamente na tabela de especificação de assets:
 * 
 * | Categoria                     | Ícone           |
 * |-------------------------------|-----------------|
 * | Entertainment and Recreation  | park_icon       |
 * | Shopping                      | store_icon      |
 * | Lodging                       | bed_icon        |
 * | Food and Drink                | restaurant_icon |
 * | Culture                       | culture_icon    |
 * | Sports                        | gym_icon        |
 * | Services                      | services_icon   |
 * | Shopping Boss                 | boss_icon       |
 * | Transportation                | bus_icon        |
 * 
 * Se uma categoria não estiver na tabela (ex: Health and Wellness, Natural Features)
 * ou o arquivo específico não existir, retorna null para utilizar o marcador padrão.
 */

export const PLACE_CATEGORY_ICON_PATHS = {
  "Entertainment and Recreation": "/sprites/map_icons/park_icon.png",
  Shopping: "/sprites/map_icons/store_icon.png",
  Lodging: "/sprites/map_icons/bed_icon.png",
  "Food and Drink": "/sprites/map_icons/restaurant_icon.png",
  Culture: "/sprites/map_icons/culture_icon.png",
  Sports: "/sprites/map_icons/gym_icon.png",
  // No pacote de assets foi fornecido 'gov_icon.png' para repartições/serviços
  Services: "/sprites/map_icons/gov_icon.png",
  Transportation: "/sprites/map_icons/bus_icon.png",
};

export const BOSS_ICON_PATH = "/sprites/map_icons/boss_icon.png";

/**
 * Retorna o caminho do ícone para a categoria do Place, ou null caso deva usar o marcador padrão.
 */
export function getPlaceCategoryIconPath(category, isBossSpecial = false) {
  if (isBossSpecial) {
    return BOSS_ICON_PATH;
  }
  return PLACE_CATEGORY_ICON_PATHS[category] || null;
}
