# Geo Quest — Project Context

## Product
Geo Quest is a location-based exploration game built around a real interactive map. Real-world points of interest (POIs) become game locations. The player explores the city physically, completes missions associated with real places, progresses through the city, and eventually unlocks a city boss.

### Problem
The project aims to help tourists and local residents discover historical, cultural, and leisure points around them through a gamified exploration loop.

### Target users
- Tourists who want a guided and playful way to discover a city.
- Residents looking for active leisure and new nearby places.

## Intended stack
- Frontend: React web application with game UI and animations.
- Backend: C# with ASP.NET Core.
- Map: Google Maps API.
- Location: browser Geolocation API.
- Project management: Trello/Kanban.

> Repository reality takes precedence over this intended architecture. At the time this document was created, `main` contained the ASP.NET Core backend scaffold but no React frontend yet.

## MVP capabilities
1. Show a map based on the player's current location.
2. Obtain and display nearby real-world POIs.
3. Convert POIs into game-interactive locations.
4. Allow selection among three simple chibi-style characters, each with one distinct advantage/attribute.
5. Let the player select a mission associated with a real location.
6. Track completion/progression across missions.
7. Unlock a city boss after the required progress.
8. Record conquered cities after boss completion.

## Product principles
- Real-world exploration is the core mechanic; features should reinforce it.
- The MVP should remain understandable and demonstrable for an academic project.
- Prefer a playable end-to-end loop over many unfinished systems.
- External API failures and denied location permission are normal states and must be handled.
- Minimize collection and storage of precise location data.

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
- social networks or chat;
- multiplayer;
- complex combat;
- large inventories or economies;
- marketplace/e-commerce;
- broad achievement systems unrelated to city progression;
- architecture rewrites that do not unlock an MVP capability.

## Definition of a useful increment
A change is useful when it:
- advances one MVP capability;
- has a visible/testable result;
- handles its main failure state;
- does not require unrelated refactors;
- can be explained and demonstrated by the project team.
