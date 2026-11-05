# Geo Quest — Project Context

## Product
Geo Quest is a location-based urban exploration RPG built around a real interactive map. Real-world points of interest (POIs) from the Google Places API become interactive game locations. The player explores the city from their real geolocation (or developer debug coordinates), traverses real walking routes, interacts with 10 categories of Places, manages Health, Energy, and Coins, battles enemies in turn-based combat, and permanently upgrades character attributes.

### Problem
The project helps tourists and local residents discover cultural, historical, commercial, natural, and leisure points around them through a gamified exploration loop.

### Target users
- Tourists who want a guided and playful way to discover a city.
- Residents looking for active leisure and nearby places to explore.

---

## Stack and Repository Structure
- **Backend (`Backend/`)**: C# with ASP.NET Core Web API on `.NET 10` (`GeoQuest.Api.csproj`).
- **Persistence (`Backend/geoquest.db`)**: SQLite with Entity Framework Core 10 (`AppDbContext` and `DatabaseInitializer`).
- **Frontend (`Frontend/`)**: React 19 + Vite + `@vis.gl/react-google-maps`.
- **Map & Location Integration**:
  - Browser Geolocation API (`navigator.geolocation.getCurrentPosition`) + Developer Debug Coordinates override in Settings.
  - Google Maps JavaScript API (`@vis.gl/react-google-maps`).
  - Google Places API (New) (`places:searchNearby`) + Places Service fallback.
  - Google Directions API (`mode=walking`).
- **Documentation (`Documentação/` and `docs/`)**:
  - `Documentação/README.md` — setup, environment variables, execution, and gameplay mechanics.
  - `Documentação/ESTRUTURA_DO_PROJETO.md` — complete directory and file reference.
  - `Documentação/CONTEXTO_DO_PROJETO.md` — consolidated project context in Portuguese.

---

## Implemented Capabilities
1. **Session Home & Initial Location (`POST /api/jogadores/atual/home`)**:
   - At the start of every session, `Home` and the player's initial coordinates (`PosicaoAtualLatitude`, `PosicaoAtualLongitude`) are updated to the current location (`forcarAtualizacao = true`).
   - Priority: (1) Debug Coordinates when enabled in Settings (`-90..90`, `-180..180`); (2) Real user location via Geolocation API. Never invents coordinates on geolocation failure.
   - Resting at `Home` (`POST /api/jogadores/atual/home/descansar`) guarantees at least 50% of max HP (`vidaAtual = Math.max(vidaAtual, Math.round(vidaMaxima * 0.50))`) without reducing current HP or modifying max HP, energy, or coins.
2. **Real-World POI Classification (`PlaceCategoryMapper` & `placeCategories.js`)**:
   - Classifies Google Places into the 10 official categories:
     - `Shopping` (`shopping_mall` -> Boss; other subcategories -> Equipment Shop)
     - `Food and Drink` (Consumable Shop)
     - `Services` (Temporary Buff Shop — `50g`, `WIP`)
     - `Health and Wellness` (Hospital — Life Checkpoint + 1x Free Heal per Place + Paid Heal `50g`)
     - `Lodging` (Rest — Energy Checkpoint + 100% Energy recovery for `25g`)
     - `Entertainment and Recreation` (3-round Combat Arena)
     - `Natural Features` (Scavenge for random Coin rewards persisted in SQLite)
     - `Transportation` (Fast travel exclusively between Places of the exact same subcategory among the 24 official Google Places transportation types, using progressive search radii `5km -> 15km -> 30km -> 50km`)
     - `Culture` (Cultural Buff placeholder — `Nada` / `WIP`)
     - `Sports` (Single permanent attribute upgrade per Place: `+1 Dano`, `+5 Vida máxima`, `+10 Energia máxima`, or `+1 Velocidade`, persisted as completed in SQLite)
3. **Turn-Based Combat & Speed Initiative (`CombatService`, `CombatEngine.js`, `CombatScreen.jsx`)**:
   - Supports Random Encounters (`Emboscada`) during route movement (`25%/km`, cap `50%`), 3-round `Arena` battles, and `Boss` battles (`shopping_mall`).
   - Turn initiative order (`calcularOrdemIniciativa`) is determined by the **Velocidade** attribute (higher acts first), recalculated at the start of combat and each round, with deterministic tie-breaking.
4. **Inventory, Equipment, Attributes & Statistics (`JogadoresController`)**:
   - 50-slot backpack (`Todos`, `Equipavel`, `Consumivel`), 7 equipment slots, trash disposal, character switching, and persistent player statistics.

---

## Security & Configuration Rules
- Never commit Google Maps Platform API keys, tokens, or secrets.
- Configure `VITE_GOOGLE_MAPS_API_KEY` in `Frontend/.env.local` and `GOOGLE_MAPS_API_KEY` via environment variable or user-secrets for the Backend.
