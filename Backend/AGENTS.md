# Backend — Codex Instructions

These instructions apply to work inside `Backend/` and complement the repository-level `AGENTS.md`.

## Runtime and project shape
- This is a C# ASP.NET Core backend targeting `.NET 10`.
- Preserve nullable reference types and implicit usings unless there is a concrete reason to change them.
- Treat the backend as an HTTP API for the game client.
- Do not add frontend UI, Razor pages/views, or frontend-specific architecture as part of new backend work unless the user explicitly requests it.
- Inspect the existing startup style in `Program.cs` before adding middleware or services.

## Design
- Keep HTTP concerns in controllers/endpoints and move non-trivial game/business rules into services or domain classes.
- Prefer dependency injection through ASP.NET Core's built-in container.
- Introduce interfaces when they create a real test seam or multiple implementations are expected; avoid interfaces for every class by default.
- Use DTOs/request-response models at API and external-provider boundaries rather than exposing internal models accidentally.
- Keep Google/POI provider concerns behind a small integration boundary so game logic does not depend directly on provider response types.
- Prefer small vertical slices that can be demonstrated and tested.
- Do not add persistence until a concrete feature needs it.

## Suggested responsibility boundaries
Use these only when the feature complexity justifies them; do not create empty architecture folders preemptively.

- `Controllers/`: HTTP endpoints, request validation, status-code mapping.
- `Services/`: application workflows and orchestration.
- `Domain/` or focused model classes: game rules such as missions, progression, character attributes, and boss unlock rules.
- `Integrations/`: Google/POI provider adapters and provider-specific DTOs.
- API DTOs: stable request/response contracts for the client.

## External APIs
- Never hard-code or commit Google API keys, tokens, or credentials.
- Read secrets from configuration/environment variables.
- Add only safe placeholder names to documentation or example configuration.
- Treat API timeout, quota errors, malformed/empty results, and upstream failures as expected error paths.
- Use `HttpClient` through ASP.NET Core DI / `IHttpClientFactory` when outbound HTTP integration is introduced.
- Prefer cancellation-aware asynchronous methods for external calls.

## Location and privacy
- Validate latitude/longitude values received by the API.
- Request/use only location precision needed by the feature.
- Do not log exact coordinates by default.
- Do not introduce persistent storage of precise user locations unless explicitly required and reviewed.
- Separate coordinates/POI lookup from mission/progression rules where practical so domain behavior can be tested without live location services.

## API behavior
- Validate input and return appropriate HTTP status codes.
- Prefer typed request/response DTOs for non-trivial endpoints.
- Keep error responses useful without leaking stack traces, secrets, or internal configuration.
- Favor consistent route naming and response shapes across controllers.

## Existing scaffold
The current repository started from an ASP.NET Core MVC template and still contains template artifacts such as `HomeController`, Razor `Views`, and MVC routing. Treat those as scaffold residue rather than the desired architecture for new backend features. Do not build new game functionality into Razor views or the template `HomeController`.

When cleaning scaffold artifacts, prefer a focused change that first establishes working API routing, then removes obsolete MVC UI files only when they are no longer needed by the team.

## Verification
For backend changes, use the smallest relevant verification available, typically:

```bash
dotnet build Backend/MeuSistema.csproj
```

Run targeted tests when tests exist. Do not claim a command passed unless it was actually executed successfully.
