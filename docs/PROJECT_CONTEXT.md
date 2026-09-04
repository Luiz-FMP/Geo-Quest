# Geo Quest — Project Context

## Product
Geo Quest is a location-based exploration game built around a real interactive map. Real-world points of interest (POIs) become game locations. The player explores the city physically, completes missions associated with real places, progresses through the city, and eventually unlocks a city boss.

### Problem
The project aims to help tourists and local residents discover historical, cultural, and leisure points around them through a gamified exploration loop.

### Target users
- Tourists who want a guided and playful way to discover a city.
- Residents looking for active leisure and new nearby places.

## Stack and repository scope
- Backend: C# with ASP.NET Core on .NET 10.
- Map integration: Google Maps/Places-related services as required by backend features.
- Location: the client supplies location data needed by backend workflows; browser geolocation belongs to the frontend/client side.
- Frontend: under separate development and intentionally out of scope for current backend work.
- Project management: Trello/Kanban.

The backend repository should expose HTTP APIs and game/application logic. It should not implement UI concerns or depend on Razor views for new functionality.

## Backend capabilities needed by the MVP
1. Accept/validate location inputs required by gameplay.
2. Obtain nearby real-world POIs through the selected provider and normalize them into game POIs.
3. Expose character data and simple distinct character attributes.
4. Support mission selection tied to a real location.
5. Track mission completion/progression.
6. Apply city boss unlock/completion rules.
7. Record or expose conquered-city history once persistence requirements are defined.

## Product principles
- Real-world exploration is the core mechanic; features should reinforce it.
- The MVP should remain understandable and demonstrable for an academic project.
- Prefer an end-to-end backend flow over many unfinished abstractions.
- External API failures and invalid/unavailable location inputs are normal states and must be handled.
- Minimize collection and storage of precise location data.
- Do not add persistence infrastructure before a concrete requirement needs it.

## Roadmap snapshot (2026)
This roadmap comes from the project planning document and is a planning reference, not a source of truth for current implementation status.

- 21/08 — scope, schedule, Kanban planning.
- 28/08 — project setup and initial Google Maps integration.
- 04/09 — user geolocation and real POIs on the map.
- 11/09 — three-character system.
- 18/09 — mission selection and movement/location flow.
- 02/10 — map + character + mission integrated prototype.
- 09/10 — progression and boss unlock.
- 16/10 — city boss and conquest history.
- 23/10 — integrated MVP target.
- 30/10 — usability testing and bug fixing.
- 06/11 — final polish and performance.
- 13/11 — final defense/presentation.

Do not automatically mark roadmap items complete based only on the date. Inspect the repository and project board when available.

## Out of scope by default
Unless explicitly requested, avoid spending MVP time on:
- frontend implementation or restructuring;
- social networks or chat;
- multiplayer;
- complex combat;
- large inventories or economies;
- marketplace/e-commerce;
- broad achievement systems unrelated to city progression;
- architecture rewrites that do not unlock an MVP capability.

## Definition of a useful backend increment
A change is useful when it:
- advances one backend MVP capability;
- exposes or supports a testable behavior;
- handles its main failure state;
- does not require unrelated refactors;
- can be explained and demonstrated by the project team.
