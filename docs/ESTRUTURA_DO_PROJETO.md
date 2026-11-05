# Geo Quest — Estrutura do Projeto

Este documento descreve a organização real do repositório **Geo Quest**, detalhando a finalidade de cada pasta e arquivo existente no frontend (`Frontend/`), no backend (`Backend/`) e na documentação (`Documentação/` e `docs/`).

---

## 1. Visão Geral da Árvore do Repositório

```text
Geo-Quest-real/
├── AGENTS.md                           # Instruções gerais de arquitetura e contexto para agentes/desenvolvedores
├── README.md                           # Guia rápido de visão geral e execução na raiz do repositório
├── docs/
│   └── PROJECT_CONTEXT.md              # Arquivo de contexto completo e atualizado do projeto
├── Documentação/
│   ├── README.md                       # Guia completo de instalação, configuração e execução do projeto
│   ├── ESTRUTURA_DO_PROJETO.md         # Este documento: mapa detalhado de pastas e arquivos
│   └── CONTEXTO_DO_PROJETO.md          # Contexto funcional e técnico consolidado em português
├── Backend/                            # API HTTP em C# / ASP.NET Core (.NET 10) + SQLite
│   ├── AGENTS.md                       # Diretrizes específicas da camada de Backend
│   ├── GeoQuest.Api.csproj             # Projeto .NET 10 com Entity Framework Core SQLite
│   ├── GeoQuest.Api.sln                # Solution do Backend
│   ├── Program.cs                      # Ponto de entrada, DI, CORS, HttpClient e inicialização do SQLite
│   ├── appsettings.json                # Configurações base (ConnectionStrings, chave Google Maps vazia)
│   ├── appsettings.Development.json    # Configurações de ambiente de desenvolvimento
│   ├── Properties/
│   │   └── launchSettings.json         # Perfis de inicialização HTTP/HTTPS (porta padrão 5208)
│   ├── Controllers/
│   │   ├── CidadesController.cs        # Endpoints de cidades registradas
│   │   ├── CombateController.cs        # Endpoint de geração de sessão de combate (Emboscada, Arena, Boss)
│   │   ├── DirectionsController.cs     # Endpoint de cálculo de rota a pé via Google Directions API
│   │   ├── InimigosController.cs       # Endpoints de catálogo de inimigos e bosses
│   │   ├── JogadoresController.cs      # Endpoints de estado do jogador, inventário, lugares, Home, Sports, Transporte
│   │   ├── PersonagensController.cs    # Endpoints de personagens jogáveis
│   │   └── PlacesController.cs         # Endpoints de busca de Places próximos e destinos de transporte
│   ├── Data/
│   │   ├── AppDbContext.cs             # Contexto EF Core SQLite e mapeamento das entidades
│   │   └── DatabaseInitializer.cs      # Criação automática de schema, migração segura de colunas e seed inicial
│   ├── DTOs/
│   │   ├── CombatDtos.cs               # Contratos de requisição/resposta para sessões e rondas de combate
│   │   └── PlayerStateDtos.cs          # Contratos de estado do jogador, atributos, inventário, Places e ações
│   ├── Integrations/
│   │   ├── GoogleDirectionsClient.cs   # Cliente HTTP para Google Directions API e decodificação de polyline
│   │   └── GooglePlacesClient.cs       # Cliente HTTP para Google Places API (New) e busca progressiva de transporte
│   ├── Models/
│   │   ├── Boss.cs                     # Entidade de Boss vinculada a uma cidade
│   │   ├── Cidade.cs                   # Entidade de Cidade
│   │   ├── Inimigo.cs                  # Entidade de Inimigo
│   │   ├── ItemDefinicao.cs            # Catálogo de definições de itens (equipáveis e consumíveis)
│   │   ├── Jogador.cs                  # Entidade principal do jogador (atributos, coordenadas, checkpoints, estatísticas)
│   │   ├── JogadorBuffAtivo.cs         # Entidade de buffs temporários ativos no jogador
│   │   ├── JogadorEquipamentoSlot.cs   # Entidade dos 7 slots de equipamento do jogador
│   │   ├── JogadorItemInventario.cs    # Entidade dos itens na mochila (50 slots)
│   │   ├── Personagem.cs               # Entidade de Personagem jogável
│   │   ├── PlaceEstadoJogador.cs       # Estado permanente de cada Place por jogador (concluído, estoqueJson, etc.)
│   │   └── PlaceVisitaHistorico.cs     # Histórico de visitas e interações do jogador com Places
│   └── Services/
│       ├── CombatService.cs            # Geração de rondas e escalonamento de atributos de combate
│       └── PlaceCategoryMapper.cs      # Classificação oficial das 10 categorias Google Places e 24 subcategorias de transporte
└── Frontend/                           # Aplicação Web em React 19 + Vite
    ├── index.html                      # Documento HTML principal
    ├── package.json                    # Dependências e scripts npm (`dev`, `build`, `lint`, `preview`)
    ├── vite.config.js                  # Configuração do Vite e proxy `/api` para `http://127.0.0.1:5208`
    ├── eslint.config.js                # Regras de lint do projeto React
    └── src/
        ├── main.jsx                    # Ponto de entrada React
        ├── App.jsx                     # Componente raiz que renderiza `GeoQuestHome`
        ├── App.css                     # Estilos globais complementares
        ├── index.css                   # Reset e variáveis tipográficas/visuais
        ├── config/
        │   └── placeholderAssets.js    # Configuração visual de placeholders para personagens, itens e categorias
        ├── services/
        │   ├── CombatEngine.js         # Motor de encontros aleatórios, sessões de combate e cálculo de iniciativa por Velocidade
        │   └── playerApi.js            # Cliente HTTP da API do jogador com sincronização local e coordenadas de debug
        ├── utils/
        │   └── placeCategories.js      # Mapeamento de categorias/subcategorias, cores, traduções e filtro de transporte
        └── components/
            ├── GeoQuestHome.jsx        # Orquestrador de telas (`menu`, `character-select`, `map`), geolocalização e estado
            ├── CharacterSelectScreen.jsx # Tela de seleção de personagem antes de iniciar o mapa
            ├── GoogleMapDemo.jsx       # Mapa interativo principal, rotas, marcadores, modo de transporte e HUD de mapa
            ├── PlaceArrivalModal.jsx   # Modal de interação com Places (Home, Lojas, Hospital, Hotel, Natural Features, Culture, Sports, Transporte, Arena, Boss)
            ├── PlaceShopModal.jsx      # Interface estrutural de lojas (Shopping: equipamentos; Food and Drink: consumíveis; Services: buffs WIP)
            ├── PlayerBottomMenu.jsx    # Botão inferior central `MENU` e submenu expansível
            ├── PlayerSystemsOverlay.jsx # Gerenciador de sobreposição dos 4 menus de tela cheia
            ├── RecoveryModal.jsx       # Modal de retorno a checkpoint ou Home por morte (Vida = 0) ou esgotamento (Energia = 0)
            ├── menus/
            │   ├── PlayerStatusModal.jsx     # Menu de Status do jogador (atributos, nome, troca de personagem, buffs)
            │   ├── PlayerInventoryModal.jsx  # Menu de Inventário (50 slots de mochila, abas, 7 slots de equipamento e lixeira)
            │   ├── PlayerStatsModal.jsx      # Menu de Estatísticas e histórico de Places visitados
            │   └── PlayerSettingsModal.jsx   # Menu de Configurações e ferramentas de desenvolvimento (Coordenadas de Debug, recarga de vida/energia/moedas)
            └── combat/
                ├── CombatScreen.jsx    # Tela principal de combate em turnos com iniciativa baseada em Velocidade
                ├── CombatArena.jsx     # Renderização visual da arena, personagem e inimigos
                ├── CombatHud.jsx       # Painel de ações de combate (Atacar, Skill, Defender, Fugir) e log tático
                └── CombatReward.jsx    # Modal de vitória/derrota e resumo de recompensas
```

---

## 2. Detalhamento da Camada de Backend (`Backend/`)

### 2.1. Inicialização e Banco de Dados (`Program.cs` e `Data/`)
- **`Program.cs`**: Configura os controllers da API, CORS (`FrontendDev`), injeção de dependência de `AppDbContext`, `CombatService`, `GooglePlacesClient` e `GoogleDirectionsClient`, e executa `DatabaseInitializer.Initialize(db)` na inicialização.
- **`Data/AppDbContext.cs`**: Define os `DbSet` do Entity Framework Core para `Personagens`, `Cidades`, `Inimigos`, `Bosses`, `Jogadores`, `ItensDefinicao`, `JogadorItensInventario`, `JogadorEquipamentosSlots`, `JogadorBuffsAtivos`, `PlacesEstadoJogador` e `PlacesVisitasHistorico`.
- **`Data/DatabaseInitializer.cs`**: Garante que o arquivo SQLite (`geoquest.db`) possua todas as tabelas e colunas necessárias (incluindo migração não-destrutiva via `PRAGMA table_info`) e popula os dados iniciais (3 personagens, cidade inicial, inimigos, boss, item de debug e jogador padrão).

### 2.2. Integrações Externas e Serviços (`Integrations/` e `Services/`)
- **`Integrations/GooglePlacesClient.cs`**:
  - `SearchNearbyPlacesAsync`: Consulta a Google Places API (New) (`places:searchNearby`) para carregar POIs próximos ao jogador e classificá-los via `PlaceCategoryMapper`.
  - `SearchProgressiveTransportDestinationsAsync`: Realiza busca progressiva exclusiva para a subcategoria exata de transporte nos raios `5000m`, `15000m`, `30000m` e `50000m`, ordenando por distância e removendo o local de origem e duplicatas.
- **`Integrations/GoogleDirectionsClient.cs`**: Consulta rotas a pé (`mode=walking`) na Google Directions API e decodifica a polyline da rota para deslocamento sobre as ruas reais.
- **`Services/PlaceCategoryMapper.cs`**: Centraliza a tabela oficial das 10 categorias permitidas da Google Places API e a lista estrita das 24 subcategorias oficiais de **Transportation**, garantindo identificação determinística por `primaryType` e `types`.
- **`Services/CombatService.cs`**: Constrói sessões de combate (`Emboscada`, `Arena` de 3 rondas e `Boss`) escalonadas pelo nível de poder do jogador.

### 2.3. Controllers da API (`Controllers/`)
- **`JogadoresController.cs` (`/api/jogadores`)**:
  - `GET /api/jogadores/atual`: Retorna o estado completo do jogador (`JogadorEstadoDto`).
  - `PUT /api/jogadores/atual/nome`: Atualiza o nome do jogador.
  - `PUT /api/jogadores/atual/personagem`: Altera o personagem ativo.
  - `PUT /api/jogadores/atual/vida`: Atualiza vida, energia e moedas (usado também pelas opções de debug).
  - `POST /api/jogadores/atual/percurso`: Consome energia proporcional à distância percorrida (`5 PE/km`) e incrementa estatísticas.
  - `POST /api/jogadores/atual/home`: Define ou atualiza a localização da `Home` e a posição inicial do personagem.
  - `POST /api/jogadores/atual/home/descansar`: Garante ao jogador pelo menos 50% da Vida máxima (`Math.Max(vidaAtual, Math.Round(vidaMaxima * 0.50))`) sem alterar vida máxima, energia ou moedas.
  - `POST /api/jogadores/atual/visitar-place`: Registra visita a um Place e atualiza checkpoint de vida quando aplicável.
  - `POST /api/jogadores/atual/hospital/curar`: Aplica cura gratuita (única por hospital) ou paga (`50g`) em locais de `Health and Wellness`.
  - `POST /api/jogadores/atual/lodging/descansar`: Recupera 100% da energia por `25g` e salva o checkpoint de energia.
  - `POST /api/jogadores/atual/natural-features/vasculhar`: Sorteia e persiste recompensa de moedas em `Natural Features`.
  - `POST /api/jogadores/atual/transporte/viajar`: Valida subcategoria idêntica de transporte, desconta moedas conforme a distância e move o jogador diretamente ao destino.
  - `POST /api/jogadores/atual/sports/treinar`: Aplica melhoria permanente única por Place de `Sports` (`+1 Dano`, `+5 Vida máxima`, `+10 Energia máxima` ou `+1 Velocidade`), marca o Place como concluído (`Concluido = true`) e registra a escolha no SQLite.
  - `POST /api/jogadores/atual/combate/concluir`: Persiste resultado de combate, moedas ganhas e conclusão de Arena/Boss.
  - `POST /api/jogadores/atual/retornar-checkpoint`: Teleporta o jogador para o checkpoint correspondente ou `Home` em caso de derrota ou esgotamento.
  - Endpoints de inventário (`/inventario/mover`, `/inventario/item/{id}`, `/inventario/equipar`, `/inventario/desequipar`, `/inventario/debug-item`).
- **`PlacesController.cs` (`/api/places`)**:
  - `GET /api/places/nearby`: Retorna Places próximos já filtrados e categorizados.
  - `GET /api/places/transport-destinations`: Retorna destinos de transporte da mesma subcategoria em busca progressiva.
- **`DirectionsController.cs` (`/api/directions`)**: Retorna pontos da rota e distância em quilômetros.
- **`CombateController.cs` (`/api/combate/iniciar`)**: Inicia sessão de combate.

---

## 3. Detalhamento da Camada de Frontend (`Frontend/`)

- **`src/components/GeoQuestHome.jsx`**: Controla o fluxo inicial do jogo, priorizando as **Coordenadas de Debug** (quando ativadas nas Configurações) ou obtendo a localização real do navegador via Geolocation API a cada nova sessão, atualizando a `Home` e a posição inicial do personagem.
- **`src/components/GoogleMapDemo.jsx`**: Renderiza o Google Maps com tema customizado, controla o marcador do personagem, o marcador especial `Home`, os marcadores coloridos por categoria, a pré-visualização e animação de rota, o painel recolhível de locais próximos e o **Modo de Mapa de Transporte** (com estilo azul dedicado, busca progressiva por subcategoria idêntica e ocultação do menu principal inferior).
- **`src/components/PlaceArrivalModal.jsx`**: Apresenta a interface contextual de cada categoria de Place ao clicar em um marcador (modo pré-visualização antes de ir e ações habilitadas após chegar ao local).
- **`src/components/PlaceShopModal.jsx`**: Implementa as interfaces de loja para **Shopping** (loja de equipamentos + inventário de equipamentos), **Food and Drink** (loja de consumíveis + inventário de consumíveis) e **Services** (interface estilo hospedagem para compra de buff temporário por `50g` em estado `WIP`).
- **`src/components/combat/CombatScreen.jsx`** e **`src/services/CombatEngine.js`**: Implementam o combate por turnos com cálculo determinístico de iniciativa pelo atributo **Velocidade** (`calcularOrdemIniciativa`), onde o combatente mais veloz age primeiro no início do combate e a cada nova ronda.
- **`src/components/menus/PlayerSettingsModal.jsx`**: Disponibiliza as opções de debug de desenvolvimento, incluindo a ferramenta **Coordenadas de Debug** (ativar/desativar, Latitude `-90..90`, Longitude `-180..180`, validação numérica e aplicação imediata na Home, personagem e mapa).

