# Geo Quest — Estrutura do Projeto

> **ORIENTAÇÃO OBRIGATÓRIA PARA AGENTES DE DESENVOLVIMENTO:** Consulte este mapa estrutural e [`docs/CONTEXTO_DO_PROJETO.md`](./CONTEXTO_DO_PROJETO.md) antes de criar, mover ou alterar qualquer arquivo no projeto.

Este documento descreve a organização atual do repositório **Geo Quest**, detalhando a finalidade de cada pasta e arquivo existente no backend (`Backend/`), no frontend (`Frontend/`) e na documentação (`docs/`).

---

## 1. Visão Geral da Árvore do Repositório

```text
GEO QUEST/
├── README.md                           # Guia rápido de visão geral, configuração e execução
├── docs/
│   ├── CONTEXTO_DO_PROJETO.md          # Arquitetura, regras de negócio, fórmulas e orientações para agentes
│   └── ESTRUTURA_DO_PROJETO.md         # Este documento: mapa detalhado de pastas e arquivos do projeto
├── Backend/                            # API HTTP em C# / ASP.NET Core (.NET 10) + SQLite
│   ├── GeoQuest.Api.csproj             # Projeto .NET 10 com Entity Framework Core SQLite
│   ├── GeoQuest.Api.sln                # Solution do Backend
│   ├── Program.cs                      # Ponto de entrada, DI, CORS, HttpClient e inicialização do SQLite
│   ├── geoquest.db                     # Banco de dados SQLite local (recriado/migrado por DatabaseInitializer)
│   ├── appsettings.json                # Configurações base (ConnectionStrings e GoogleMaps)
│   ├── appsettings.Development.json    # Configurações de ambiente de desenvolvimento
│   ├── Properties/
│   │   └── launchSettings.json         # Perfis de inicialização HTTP/HTTPS (porta padrão 5208)
│   ├── Controllers/
│   │   ├── CombatController.cs         # Endpoint de geração de sessão de combate (/api/combate/iniciar)
│   │   ├── DirectionsController.cs     # Endpoint de cálculo de rota a pé via Google Routes API (/api/directions)
│   │   ├── JogadoresController.cs      # Endpoints de estado do jogador, inventário, lojas, buffs, Places, Home, Sports, Transporte e Combate
│   │   ├── PersonagensController.cs    # Endpoint de listagem de personagens jogáveis (/api/personagens)
│   │   └── PlacesController.cs         # Endpoints de busca de Places próximos e destinos de transporte (/api/places)
│   ├── Data/
│   │   ├── GeoQuestDbContext.cs        # Contexto EF Core SQLite, mapeamento de entidades e seed de catálogo base
│   │   └── DatabaseInitializer.cs      # Criação automática de schema, migração não-destrutiva de colunas e seed inicial
│   ├── DTOs/
│   │   ├── CombateDtos.cs              # Contratos de requisição/resposta para sessões e rondas de combate
│   │   ├── GamePoiDto.cs               # Contratos de POIs e destinos de transporte retornados pelo Backend
│   │   └── JogadorDtos.cs              # Contratos de estado do jogador, atributos, inventário, lojas, buffs e interações
│   ├── Integrations/
│   │   ├── IGooglePlacesClient.cs      # Interface e modelos de integração com a Google Places API (New)
│   │   └── GooglePlacesClient.cs       # Cliente HTTP para Google Places API (New), cálculo Haversine e resolução de API Key
│   ├── Models/
│   │   └── Entities.cs                 # Entidades EF Core consolidadas (Jogador, Personagem, Cidade, Categoria, Inimigo, Boss, MissaoConcluida, ItemDefinicao, ItemInventario, EstatisticaJogador, HistoricoVisitaPlace, EstadoPermanentePlace, BuffJogador)
│   └── Services/
│       ├── CombatService.cs            # Geração de rondas e escalonamento de atributos de combate
│       ├── PlaceCategoryMapper.cs      # Classificação oficial das 10 categorias Google Places e 24 subcategorias de transporte
│       └── PlayerStatsCalculator.cs    # Cálculo centralizado de atributos finais, buffs ativos e estado de lugares (loja/serviços)
└── Frontend/                           # Aplicação Web em React 19 + Vite
    ├── index.html                      # Documento HTML principal
    ├── package.json                    # Dependências e scripts npm (`dev`, `build`, `lint`, `preview`)
    ├── vite.config.js                  # Configuração do Vite e proxy `/api` para `http://127.0.0.1:5208`
    ├── eslint.config.js                # Configuração de lint do projeto React
    ├── public/
    │   └── sprites/                    # Sprites de personagens, inimigos, bosses, itens e ícones de mapa
    └── src/
        ├── main.jsx                    # Ponto de entrada React
        ├── App.jsx                     # Componente raiz que renderiza `GeoQuestHome`
        ├── index.css                   # Estilos globais e reset
        ├── config/
        │   ├── characterAssets.js      # Configuração centralizada de spritesheets, ícones e cores dos 3 personagens
        │   └── placeholderAssets.js    # Placeholders visuais de personagens (derivados de characterAssets), inimigos, itens e categorias
        ├── services/
        │   ├── CombatEngine.js         # Motor de encontros aleatórios, sessões de combate e cálculo de iniciativa por Velocidade
        │   └── playerApi.js            # Cliente HTTP da API do jogador com fallback local sincronizado e coordenadas de debug
        ├── utils/
        │   ├── geolocation.js          # Geolocalização do navegador, Coordenadas de Debug e função compartilhada `haversineDistanceKm`
        │   ├── mapPlaceIcons.js        # Mapeamento de ícones de mapa por categoria/subcategoria
        │   ├── placeCategories.js      # Mapeamento de categorias/subcategorias, cores, traduções e filtro de transporte
        │   └── playerMapSprite.js      # Pré-renderização de frames animados do marcador do jogador no mapa
        └── components/
            ├── ActiveBuffsBar.jsx      # Barra de buffs temporários ativos com cronômetro regressivo
            ├── CharacterSelectScreen.jsx # Tela de seleção de personagem antes de iniciar o mapa
            ├── GeoQuestHome.jsx        # Orquestrador de telas (`menu`, `character-select`, `map`), geolocalização e ações do jogador
            ├── GoogleMapDemo.jsx       # Mapa interativo principal, rotas, marcadores, modo de transporte e HUD superior
            ├── PlaceArrivalModal.jsx   # Modal de interação com Places (Home, Lojas, Hospital, Hotel, Natural Features, Culture, Sports, Transporte, Arena, Boss)
            ├── PlaceShopModal.jsx      # Interface de lojas funcionais (Shopping: equipamentos; Food and Drink: consumíveis)
            ├── PlayerBottomMenu.jsx    # Botão inferior central `MENU` e submenu expansível
            ├── PlayerSystemsOverlay.jsx # Gerenciador de sobreposição dos 4 menus de tela cheia
            ├── RecoveryModal.jsx       # Modal de retorno a checkpoint ou Home por morte (Vida = 0) ou esgotamento (Energia = 0)
            ├── menus/
            │   ├── PlayerStatusModal.jsx     # Menu de Status do jogador (atributos, nome, troca de personagem, buffs)
            │   ├── PlayerInventoryModal.jsx  # Menu de Inventário (50 slots de mochila, abas, uso de consumíveis, 7 slots de equipamento e lixeira)
            │   ├── PlayerStatsModal.jsx      # Menu de Estatísticas e histórico de Places visitados
            │   └── PlayerSettingsModal.jsx   # Menu de Configurações e ferramentas de desenvolvimento (Coordenadas de Debug, recarga de vida/energia/moedas)
            └── combat/
                ├── CharacterAnimatedSprite.jsx # Renderizador de spritesheet animado para combate e seleção de personagem
                ├── CombatScreen.jsx          # Tela principal de combate em turnos com iniciativa baseada em Velocidade
                ├── CombatArena.jsx           # Renderização visual da arena, personagem e inimigos
                ├── CombatHud.jsx             # Painel de ações de combate (Atacar, Skill, Defender, Fugir) e log tático
                └── CombatReward.jsx          # Modal de vitória/derrota e resumo de recompensas
```

---

## 2. Detalhamento da Camada de Backend (`Backend/`)

- **`Program.cs` e `Data/`**:
  - `Program.cs` registra os controllers, CORS (`FrontendDev`), `GeoQuestDbContext`, `CombatService` e `IGooglePlacesClient`, executando `DatabaseInitializer.Initialize(db)` na inicialização.
  - `Data/GeoQuestDbContext.cs` e `Data/DatabaseInitializer.cs` compartilham a definição base dos personagens (`GetDefaultPersonagens`) e do item de debug (`CreateDebugSwordDefinition`), garantindo a criação automática e migração segura do schema em `geoquest.db`.
- **`Models/Entities.cs`**:
  - Reúne todas as 13 entidades relacionais do banco de dados em um único arquivo coeso: `Cidade`, `Categoria`, `Personagem`, `Jogador`, `MissaoConcluida`, `Inimigo`, `Boss`, `ItemDefinicao`, `ItemInventario`, `EstatisticaJogador`, `HistoricoVisitaPlace`, `EstadoPermanentePlace` e `BuffJogador`.
- **`Services/` e `Integrations/`**:
  - `PlayerStatsCalculator.cs` calcula atributos finais do jogador, remove buffs expirados e gerencia a geração determinística de estoques de lojas e atributos de serviços/cultura.
  - `PlaceCategoryMapper.cs` classifica POIs nas 10 categorias oficiais do jogo e valida as 24 subcategorias de transporte.
  - `GooglePlacesClient.cs` centraliza a busca de Places próximos, a busca progressiva de transporte (`5km -> 15km -> 30km -> 50km`), o cálculo de distância Haversine (`CalculateHaversineKm`) e a resolução da chave da API Google (`ResolveGoogleApiKey`).

---

## 3. Detalhamento da Camada de Frontend (`Frontend/`)

- **`src/config/` e `src/utils/`**:
  - `characterAssets.js` concentra os metadados dos 3 personagens jogáveis (`CHARACTERS_CONFIG`), reutilizados por `placeholderAssets.js` e `playerApi.js`.
  - `geolocation.js` fornece `haversineDistanceKm`, validação de coordenadas, persistência de Coordenadas de Debug e captura de geolocalização do navegador.
- **`src/services/`**:
  - `playerApi.js` encapsula todas as chamadas HTTP para `/api/jogadores`, `/api/personagens` e `/api/places`, mantendo sincronização automática com o estado local de fallback.
  - `CombatEngine.js` gerencia o planejamento de emboscadas em rotas, inicialização de sessões de combate e cálculo de ordem de iniciativa por Velocidade.
- **`src/components/`**:
  - `GeoQuestHome.jsx` orquestra o estado global do jogador e repassa callbacks padronizados via `withPlayerState` para `GoogleMapDemo` e `PlayerSystemsOverlay`.

---

> **REGRA DE MANUTENÇÃO DA DOCUMENTAÇÃO:** Toda vez que o código relacionado a este documento for alterado, este documento também deverá ser revisado e atualizado ao final da tarefa, caso necessário. Todo agente deve consultar a documentação antes de iniciar qualquer alteração e atualizá-la antes de concluir seu trabalho, garantindo que ela permaneça sincronizada com o código.
