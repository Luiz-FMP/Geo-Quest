# Geo Quest — Codex Project Instructions

## Mission
Geo Quest is a location-based exploration game. Real-world points of interest (POIs) become interactive game locations. Players move through a city, complete missions tied to real places, progress toward a city boss, and record conquered cities.

## Current repository state
- The repository currently contains an ASP.NET Core backend scaffold under `Backend/`.
- The backend targets `.NET 10`.
- The intended product architecture includes a React frontend, but no React frontend is currently present in `main`.
- Do not pretend planned components already exist. Inspect the repository before every task and distinguish current code from planned architecture.

## Product scope
Keep implementation focused on the MVP:
1. Map based on the player's current location.
2. Real-world POIs represented as game POIs.
3. Three selectable characters with simple distinct attributes.
4. Mission selection tied to a real location.
5. Mission completion/progression.
6. City boss unlock and completion.
7. History of conquered cities.

Avoid expanding into unrelated features such as chat, social feeds, marketplaces, complex combat systems, large inventory systems, or other features not required by the MVP unless the user explicitly requests them.

## Architecture rules
- Backend: C# / ASP.NET Core.
- Frontend target: React.
- Keep frontend and backend responsibilities separated.
- Prefer small, explicit APIs and clear DTOs at the frontend/backend boundary.
- Do not replace the chosen stack or introduce a new framework without explicit approval.
- Reuse existing project structure and conventions before creating new abstractions.
- Prefer the smallest vertical slice that proves the requested behavior.

## Maps and geolocation
- Treat Google Maps and browser geolocation as external integrations with failure states.
- Never commit API keys, tokens, credentials, or secrets.
- Use environment/configuration variables for secrets and document required variable names with safe placeholders only.
- Handle denied/unavailable geolocation explicitly; do not assume location permission is granted.
- Avoid persisting precise user location unless the feature truly requires it.
- Keep location-dependent logic testable by separating raw geolocation access from game rules where practical.

## Development workflow
Before editing:
1. Inspect the relevant files and current branch state.
2. Identify whether the task affects backend, frontend, external APIs, or game rules.
3. State assumptions only when necessary; do not invent missing requirements.
4. Prefer focused edits over broad refactors.

After editing:
1. Build or test the area changed when tooling is available.
2. Report what was validated and what could not be validated.
3. Call out configuration or API-key requirements without exposing secrets.
4. Keep unrelated files untouched.

## Backend guidance
- Keep controllers thin when business rules become non-trivial.
- Move reusable game/domain rules into services or domain classes instead of accumulating logic in controllers.
- Use asynchronous APIs for I/O-bound work.
- Preserve nullable reference type correctness.
- Validate request input at API boundaries.
- Do not add persistence/database infrastructure until a feature requires it or the user approves it.

## Frontend guidance
When a React frontend exists:
- Keep map rendering, geolocation access, and game state as separate concerns.
- Prefer reusable components and hooks only when they reduce duplication or clarify ownership.
- Represent loading, permission-denied, API-error, and empty-POI states explicitly.
- Preserve responsive behavior because the game is expected to be used while moving around a city.

## Git and review
- Do not push directly to `main` unless the user explicitly asks.
- Prefer a focused branch and pull request for meaningful changes.
- Do not rewrite unrelated history.
- Review for correctness, secrets, location/privacy risks, regressions, and missing validation before style-only concerns.

## Project context
For product goals and roadmap context, read `docs/PROJECT_CONTEXT.md` when planning a feature that touches scope or milestones.
