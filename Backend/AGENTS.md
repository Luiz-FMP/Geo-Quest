# Backend — Codex Instructions

These instructions apply to work inside `Backend/` and complement the repository-level `AGENTS.md`.

## Runtime and project shape
- This is an ASP.NET Core project targeting `.NET 10`.
- Preserve nullable reference types and implicit usings unless there is a concrete reason to change them.
- Inspect the existing startup style in `Program.cs` before adding middleware or services.

## Design
- Keep HTTP concerns in controllers and move non-trivial game/business rules into services or domain classes.
- Prefer dependency injection through ASP.NET Core's built-in container.
- Introduce interfaces when they create a real test seam or multiple implementations are expected; avoid interfaces for every class by default.
- Use DTOs/request-response models at external API boundaries rather than exposing internal models accidentally.
- Keep Google/POI provider concerns behind a small integration boundary so game logic does not depend directly on provider response types.

## External APIs
- Never hard-code or commit Google API keys, tokens, or credentials.
- Read secrets from configuration/environment variables.
- Add only safe placeholder names to documentation or example configuration.
- Treat API timeout, quota errors, malformed/empty results, and upstream failures as expected error paths.

## Location and privacy
- Request only location precision needed by the feature.
- Do not log exact coordinates by default.
- Do not introduce persistent storage of precise user locations unless explicitly required and reviewed.
- Separate coordinates/POI lookup from mission/progression rules where practical so domain behavior can be tested without live location services.

## API behavior
- Validate input and return appropriate HTTP status codes.
- Prefer cancellation-aware asynchronous methods for network/database I/O.
- Keep error responses useful without leaking stack traces, secrets, or internal configuration.

## Verification
For backend changes, use the smallest relevant verification available, typically:

```bash
dotnet build Backend/MeuSistema.csproj
```

Run targeted tests when tests exist. Do not claim a command passed unless it was actually executed successfully.
