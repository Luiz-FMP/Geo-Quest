# Geo Quest — Guia do Projeto e Documentação Técnica

**Geo Quest** é um jogo web de exploração geolocalizada em que pontos de interesse reais (Google Places) se transformam em locais interativos de RPG urbano. O jogador explora o mapa a partir de sua localização real (ou coordenadas de debug), percorre rotas reais consumindo energia, interage com estabelecimentos de 10 categorias distintas, enfrenta emboscadas, arenas e bosses em combate por turnos e evolui permanentemente seus atributos.

---

## 1. Tecnologias Utilizadas

### Frontend (`Frontend/`)
- **React 19** + **Vite 8**
- **`@vis.gl/react-google-maps`** para renderização do Google Maps JavaScript API, marcadores customizados, polylines de rotas e integração com a biblioteca Places.
- **ESLint 9** para verificação estática de código.

### Backend (`Backend/`)
- **C# / ASP.NET Core Web API** em **.NET 10** (`net10.0`)
- **Entity Framework Core 10 + SQLite** (`Microsoft.EntityFrameworkCore.Sqlite`) para persistência local relacional (`Backend/geoquest.db`).
- **Google Maps Platform Web Services**:
  - **Places API (New)** (`https://places.googleapis.com/v1/places:searchNearby`) para busca de locais próximos e busca progressiva de terminais de transporte.
  - **Directions API** (`https://maps.googleapis.com/maps/api/directions/json`) para traçado de rotas reais a pé.

---

## 2. Pré-requisitos

1. **.NET SDK 10.0** ou superior instalado (`dotnet --version`).
2. **Node.js 20+** e **npm** instalados (`node --version` e `npm --version`).
3. Uma chave de API da **Google Maps Platform** com as seguintes APIs habilitadas no Google Cloud Console:
   - **Maps JavaScript API**
   - **Places API (New)** e **Places API**
   - **Directions API**

---

## 3. Configuração de Variáveis de Ambiente e Chaves da Google Maps Platform

> **Importante:** Nunca adicione chaves reais diretamente em arquivos versionados pelo Git (`appsettings.json`, código-fonte ou documentação).

### 3.1. Configuração no Frontend (`Frontend/.env.local`)
Crie o arquivo `Frontend/.env.local` (ignorado pelo Git) na pasta `Frontend/`:

```env
VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_GOOGLE_MAPS_AQUI
VITE_API_BASE_URL=http://127.0.0.1:5208
```

### 3.2. Configuração no Backend (Variável de Ambiente ou User Secrets)
O backend lê a chave da Google Maps Platform a partir de `GoogleMaps:ApiKey` ou da variável de ambiente `GOOGLE_MAPS_API_KEY`.

No PowerShell (Windows):
```powershell
$env:GOOGLE_MAPS_API_KEY="SUA_CHAVE_GOOGLE_MAPS_AQUI"
```

No Bash (Linux/macOS):
```bash
export GOOGLE_MAPS_API_KEY="SUA_CHAVE_GOOGLE_MAPS_AQUI"
```

---

## 4. Como Executar o Backend (`Backend/`)

Na raiz do repositório, execute:

```powershell
dotnet build Backend/GeoQuest.Api.csproj
dotnet run --project Backend/GeoQuest.Api.csproj
```

- A API ficará disponível por padrão em `http://localhost:5208` (ou `http://127.0.0.1:5208`).
- Na primeira execução, o `DatabaseInitializer` criará automaticamente o banco SQLite `Backend/geoquest.db` com os personagens, inimigos, boss e estado inicial do jogador.

---

## 5. Como Executar o Frontend (`Frontend/`)

Em outro terminal, instale as dependências e inicie o servidor de desenvolvimento Vite:

```powershell
cd Frontend
npm install
npm run dev
```

- Acesse a URL exibida no terminal (por padrão `http://localhost:5173`).
- Para gerar a build de produção e validar o lint:
  ```powershell
  npm run lint
  npm run build
  ```

---

## 6. Mecânicas Principais e Fluxo de Jogo

### 6.1. Home e Localização Inicial (com Coordenadas de Debug)
- Ao clicar em **Jogar**, o sistema define a localização da **Home** e a posição inicial do personagem com as mesmas coordenadas da sessão atual, sem manter coordenadas antigas de sessões anteriores.
- **Ordem de prioridade**:
  1. Se o modo **Coordenadas de Debug** estiver ativado em **MENU → Configurações**, utiliza a Latitude (`-90` a `90`) e Longitude (`-180` a `180`) configuradas.
  2. Caso contrário, solicita a localização real do dispositivo via `navigator.geolocation.getCurrentPosition`.
- Se a geolocalização falhar ou for negada, o sistema exibe uma mensagem clara de erro e não inventa coordenadas fictícias.
- **Descanso na Home**: Garante que a vida atual do jogador fique em pelo menos **50% da Vida máxima**:
  $$\text{vidaAtual} = \max(\text{vidaAtual}, \text{vidaMaxima} \times 0.5)$$
  Exemplos: `10/50 → 25/50`, `30/50 → 30/50`, `50/50 → 50/50`. Não altera vida máxima, energia, moedas nem outros atributos, persistindo o resultado no SQLite.

### 6.2. Categorias de Places e Interações
| Categoria | Cor | Função no Jogo |
|---|---|---|
| **Home (Local Especial)** | Verde (`#10B981`) | Ponto inicial da sessão e descanso gratuito que garante no mínimo 50% da Vida máxima. |
| **Shopping (`shopping_mall`)** | Âmbar (`#F59E0B`) | **Boss Especial**: Combate obrigatório contra o Boss do território. Concluído permanentemente após vitória. |
| **Shopping (demais subcategorias)** | Laranja (`#F97316`) | **Loja de Equipamentos**: Vitrine superior (10 slots preparados para equipamentos) + inventário de equipamentos do jogador na parte inferior. |
| **Food and Drink** | Amarelo (`#EAB308`) | **Loja de Consumíveis**: Vitrine superior + inventário de consumíveis do jogador na parte inferior. |
| **Services** | Ciano (`#06B6D4`) | **Loja de Buffs (`WIP`)**: Exibe nome, descrição e opção de aprimoramento temporário por `50g` (em desenvolvimento, sem descontar moedas ou alterar atributos). |
| **Health and Wellness** | Esmeralda (`#10B981`) | **Hospital**: Salva o **Checkpoint de Vida** ao visitar. Oferece cura gratuita única por local (`+25%` ou `+50%` em `general_hospital`) e cura paga (`50g`). |
| **Lodging** | Índigo (`#6366F1`) | **Hospedagem**: Recupera 100% da Energia por `25g` e salva o **Checkpoint de Energia**. |
| **Entertainment and Recreation** | Vermelho (`#EF4444`) | **Arena**: Combate em 3 rondas com recompensa garantida e conclusão permanente do Place após vitória. |
| **Natural Features** | Verde Floresta (`#22C55E`) | **Vasculhar Local**: Sorteia recompensa de moedas (`none`, `low`: 5–15g, `medium`: 16–30g, `high`: 31–60g) persistida no SQLite. |
| **Transportation** | Azul (`#3B82F6`) | **Viagem Rápida**: Abre o mapa alternativo de transporte exibindo exclusivamente destinos da **mesma subcategoria** (entre as 24 subcategorias oficiais da Places API) em busca progressiva de até 50 km. |
| **Culture** | Rosa (`#EC4899`) | **Espaço Cultural (`WIP`)**: Concede placeholder de buff cultural (`Nada` / `WIP`) na aba Status. |
| **Sports** | Violeta (`#A855F7`) | **Centro de Treinamento**: Permite escolher **uma única melhoria permanente por Place** (`+1 Dano`, `+5 Vida máxima`, `+10 Energia máxima` ou `+1 Velocidade`), marcando o Place como concluído no SQLite. |

### 6.3. Sistema de Combate e Iniciativa por Velocidade
- Ocorre em **Emboscadas** (encontros aleatórios durante rotas), **Arenas** (`Entertainment and Recreation`) e **Bosses** (`shopping_mall`).
- A **ordem de iniciativa** é calculada no início de cada combate e de cada ronda a partir do atributo **Velocidade** (`calcularOrdemIniciativa`):
  - Quem possui maior **Velocidade** age primeiro.
  - Em caso de empate de Velocidade, utiliza-se critério secundário determinístico (jogador age antes de inimigo; entre inimigos, respeita-se o índice original da ronda e o identificador).

---

## 7. Documentação Complementar

- [Estrutura Detalhada do Projeto (`Documentação/ESTRUTURA_DO_PROJETO.md`)](./ESTRUTURA_DO_PROJETO.md)
- [Contexto do Projeto (`Documentação/CONTEXTO_DO_PROJETO.md`)](./CONTEXTO_DO_PROJETO.md)
- [Project Context (`docs/PROJECT_CONTEXT.md`)](../docs/PROJECT_CONTEXT.md)

