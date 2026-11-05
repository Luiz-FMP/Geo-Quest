# Backend — Instructions

These instructions apply to work inside `Backend/` and complement the repository-level `AGENTS.md`.

## Runtime and Project Shape
- C# ASP.NET Core Web API targeting `.NET 10` (`Backend/GeoQuest.Api.csproj`).
- Uses SQLite via Entity Framework Core (`Data/AppDbContext.cs` and `Data/DatabaseInitializer.cs`).
- Preserve nullable reference types and implicit usings.
- Treat the backend as a pure HTTP JSON API for the React frontend (`Frontend/`).

## Responsibility Boundaries
- `Controllers/`: HTTP endpoints (`JogadoresController`, `PlacesController`, `DirectionsController`, `CombateController`, `PersonagensController`, `InimigosController`, `CidadesController`), input validation, and status-code mapping.
- `Services/`: Domain/application services (`CombatService`, `PlaceCategoryMapper`).
- `Integrations/`: External Google Maps Platform HTTP adapters (`GooglePlacesClient`, `GoogleDirectionsClient`).
- `Data/`: EF Core `AppDbContext` and non-destructive SQLite schema initialization/seeding (`DatabaseInitializer`).
- `Models/` & `DTOs/`: Persistent entities and explicit API request/response contracts.

## External APIs & Security
- Never hard-code or commit Google API keys, tokens, or credentials.
- Read secrets from configuration (`GoogleMaps:ApiKey`) or environment variables (`GOOGLE_MAPS_API_KEY`).
- Validate latitude (`-90..90`) and longitude (`-180..180`) values received by the API.
- Handle API timeouts, quota errors, and empty results gracefully.

## Verification
```powershell
dotnet build Backend/GeoQuest.Api.csproj
```
