# Geo Quest

**Geo Quest** é um jogo web de exploração geolocalizada em que pontos de interesse reais da **Google Places API** se transformam em locais interativos de RPG urbano.

---

## Estrutura Principal do Repositório

- [`Backend/`](./Backend): API HTTP em C# / ASP.NET Core (`.NET 10`) com persistência relacional **SQLite** (`geoquest.db`) e integração com Google Places API (New) e Google Directions API.
- [`Frontend/`](./Frontend): Aplicação web interativa em **React 19 + Vite** integrada ao Google Maps JavaScript API (`@vis.gl/react-google-maps`).
- [`Documentação/`](./docs): Documentação do projeto em português e em inglês:
  - [`Documentação/ESTRUTURA_DO_PROJETO.md`](./docs/ESTRUTURA_DO_PROJETO.md) — Mapa detalhado de todas as pastas, componentes, serviços, controllers e modelos.
  - [`Documentação/CONTEXTO_DO_PROJETO.md`](./docs/CONTEXTO_DO_PROJETO.md) — Visão consolidada da arquitetura e funcionalidades implementadas.
  - [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md): Contexto técnico e de produto do repositório.

---

## Execução Rápida

### 1. Configurar chave da Google Maps Platform
- Crie `Frontend/.env.local` com:
  ```env
  VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_GOOGLE_MAPS_AQUI
  VITE_API_BASE_URL=http://127.0.0.1:5208
  ```
- No terminal do Backend, defina a variável de ambiente:
  ```powershell
  $env:GOOGLE_MAPS_API_KEY="SUA_CHAVE_GOOGLE_MAPS_AQUI"
  ```

### 2. Iniciar o Backend (.NET 10)
```powershell
dotnet run --project Backend/GeoQuest.Api.csproj
```

### 3. Iniciar o Frontend (React + Vite)
```powershell
cd Frontend
npm install
npm run dev
```