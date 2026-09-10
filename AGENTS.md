# Geo Quest — Codex Project Instructions

## Mission
Geo Quest is a location-based exploration game. Real-world points of interest (POIs) become interactive game locations. Players move through a city, complete missions tied to real places, progress toward a city boss, and record conquered cities.

## Current work scope
- Codex work in this repository should focus on the backend unless the user explicitly requests otherwise.
- The backend lives under `Backend/` and is written in C# with ASP.NET Core on .NET 10.
- The frontend is being developed separately. Do not create, restructure, or make assumptions about frontend code as part of backend tasks.
- Do not treat the absence of frontend code in this repository as a backend problem.
- Inspect the repository before every task and distinguish current code from planned features.

## Product scope
Keep backend implementation focused on supporting the MVP:
1. Location/coordinate input needed for map-driven gameplay.
2. Real-world POI lookup and normalization into game POIs.
3. Character data and simple distinct attributes.
4. Mission selection tied to a real location.
5. Mission completion and progression.
6. City boss unlock/completion rules.
7. History of conquered cities.

Avoid expanding into unrelated features such as chat, social feeds, marketplaces, complex combat systems, large inventory systems, or other features not required by the MVP unless the user explicitly requests them.

## Backend architecture rules
- Language: C#.
- Framework: ASP.NET Core on .NET 10.
- The backend should expose HTTP APIs for the client rather than owning frontend UI concerns.
- Keep API contracts explicit with request/response DTOs when needed.
- Keep controllers thin when business rules become non-trivial.
- Put reusable game/domain rules into services or domain classes instead of accumulating logic in controllers.
- Keep provider-specific Google/POI models behind an integration boundary so game logic does not depend directly on external response shapes.
- Prefer dependency injection through ASP.NET Core's built-in container.
- Introduce interfaces only when they provide a real test seam or multiple implementations are expected.
- Do not replace the chosen stack or introduce a new framework without explicit approval.
- Prefer focused vertical slices over speculative architecture.
- Do not add persistence/database infrastructure until a feature requires it or the user approves it.

## Maps, POIs, and location
- Treat Google Maps/Places and location inputs as external or untrusted boundaries with failure states.
- Never commit API keys, tokens, credentials, or secrets.
- Read secrets from configuration/environment variables and document only safe variable names/placeholders.
- Handle unavailable coordinates, invalid coordinates, empty POI results, timeouts, quota failures, and upstream API failures explicitly.
- Avoid persisting precise user location unless the feature truly requires it.
- Do not log exact coordinates by default.
- Keep coordinate/POI lookup separate from mission/progression rules where practical so domain behavior can be tested without live provider calls.

## API behavior
- Validate input at API boundaries.
- Return appropriate HTTP status codes and useful error responses without exposing stack traces, secrets, or internal configuration.
- Prefer cancellation-aware asynchronous methods for network/database I/O.
- Preserve nullable reference type correctness.

## Development workflow
Before editing:
1. Inspect the relevant backend files and current branch state.
2. Identify the smallest backend behavior required by the task.
3. State assumptions only when necessary; do not invent missing requirements.
4. Prefer focused edits over broad refactors.

After editing:
1. Run `dotnet build Backend/MeuSistema.csproj` when the environment supports it.
2. Run targeted tests when tests exist.
3. Report what was validated and what could not be validated.
4. Call out configuration/API-key requirements without exposing secrets.
5. Keep unrelated files untouched.

## Git and review
- Do not push directly to `main` unless the user explicitly asks.
- Prefer a focused branch and pull request for meaningful changes.
- Do not rewrite unrelated history.
- Review first for correctness, secrets, location/privacy risks, regressions, and missing validation; style-only concerns come later.

## Project context
For product goals and roadmap context, read `docs/PROJECT_CONTEXT.md` when planning a feature that touches scope or milestones.
