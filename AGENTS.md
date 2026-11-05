# Geo Quest — Project Instructions

## Mission
Geo Quest is a location-based exploration game. Real-world points of interest (POIs) from the Google Places API become interactive game locations. Players move through a city, interact with categorized Places, battle enemies and bosses, upgrade attributes, and progress across real-world locations.

## Current Repository Scope
- **`Backend/`**: Written in C# with ASP.NET Core Web API on `.NET 10` (`GeoQuest.Api.csproj`) and SQLite (`Entity Framework Core`).
- **`Frontend/`**: Written in React 19 + Vite (`@vis.gl/react-google-maps`).
- **`Documentação/` & `docs/`**: Project documentation, directory structure reference (`Documentação/ESTRUTURA_DO_PROJETO.md`), setup guide (`Documentação/README.md`), and project context (`docs/PROJECT_CONTEXT.md`).
- Inspect the repository before every task and reuse existing components, controllers, DTOs, and services instead of creating duplicate implementations.

## Core Architecture Rules
- **Backend**:
  - Language: C# on ASP.NET Core (`.NET 10`).
  - Persist important player state changes in SQLite (`AppDbContext` / `geoquest.db`).
  - Keep API contracts explicit with request/response DTOs (`DTOs/PlayerStateDtos.cs`, `DTOs/CombatDtos.cs`).
  - Keep Google Maps/Places/Directions models behind integration boundaries (`Integrations/GooglePlacesClient.cs`, `Integrations/GoogleDirectionsClient.cs`, `Services/PlaceCategoryMapper.cs`).
- **Frontend**:
  - React 19 + Vite in `Frontend/src/`.
  - Keep Place category/subcategory classification synchronized with the backend (`src/utils/placeCategories.js` and `Backend/Services/PlaceCategoryMapper.cs`).
  - Ensure the backend validates and persists state changes while keeping local fallback state consistent in `src/services/playerApi.js`.

## Maps, POIs, and Location Rules
- Never commit API keys, tokens, credentials, or secrets.
- Read secrets from configuration/environment variables (`GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY`) and document only safe placeholder names.
- Handle unavailable coordinates, invalid coordinates, empty POI results, timeouts, quota failures, and upstream API failures explicitly.
- Never invent coordinates when geolocation fails; respect the priority order: (1) Debug Coordinates when enabled in Settings, (2) Browser Geolocation API.
- For **Transportation** Places, use only the 24 official Google Places transportation subcategories and search exclusively for destinations of the exact same subcategory using progressive radii (`5km -> 15km -> 30km -> 50km`).

## Verification Workflow
After editing:
1. Run `dotnet build Backend/GeoQuest.Api.csproj`.
2. Run `npm --prefix Frontend run lint` and `npm --prefix Frontend run build`.
3. Report what was validated and call out any configuration/API-key requirements without exposing secrets.
