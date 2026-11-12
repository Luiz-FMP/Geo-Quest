# Geo Quest — Contexto Completo do Projeto

> **ORIENTAÇÃO OBRIGATÓRIA PARA AGENTES DE DESENVOLVIMENTO:** Todo agente de desenvolvimento deve consultar este documento e [`docs/ESTRUTURA_DO_PROJETO.md`](./ESTRUTURA_DO_PROJETO.md) antes de iniciar qualquer investigação ou modificação no repositório. Reutilize os componentes, serviços, controllers, DTOs e entidades existentes em vez de criar implementações duplicadas.

---

## 1. Visão Geral do Produto
**Geo Quest** é um jogo web de exploração baseada em localização real. Pontos de interesse do mundo real obtidos pela **Google Places API (New)** tornam-se estabelecimentos interativos no mapa do jogo. O jogador se desloca fisicamente ou por rotas traçadas pela **Google Directions API / Routes API**, gerencia **Vida**, **Energia** e **Moedas**, equipa itens, recebe buffs temporários, combate inimigos e bosses em turnos e evolui seus atributos permanentes.

---

## 2. Arquitetura Atual do Sistema

| Camada | Tecnologia | Responsabilidade Principal |
|---|---|---|
| **Frontend** | React 19 + Vite + `@vis.gl/react-google-maps` | Interface do mapa interativo, geolocalização do navegador, modais de interação com Places, lojas, inventário, combate em turnos, buffs ativos e configurações de debug. |
| **Backend** | C# / ASP.NET Core (.NET 10) | Validação de regras de negócio, cálculo de atributos (`PlayerStatsCalculator`), persistência do estado do jogador, integração com Google Places/Directions e geração de sessões de combate (`CombatService`). |
| **Persistência** | SQLite (`Backend/geoquest.db`) + EF Core 10 (`GeoQuestDbContext`) | Armazenamento relacional de jogadores, personagens, cidades, inimigos, bosses, itens, inventário (50 slots + 7 equipamentos), buffs temporários, estatísticas, histórico de visitas e estado permanente de cada Place (`EstadosPermanentesPlaces`). |

---

## 3. Regras de Negócio e Funcionalidades Implementadas

### 3.1. Home e Localização Inicial (com Coordenadas de Debug)
- A **Home** representa sempre a localização atual do usuário ao iniciar uma sessão (`forcarAtualizacao = true`), definindo tanto a `Home` (`HomeLatitude` / `HomeLongitude`) quanto a posição inicial do personagem (`PosicaoAtualLatitude` / `PosicaoAtualLongitude`).
- **Ordem de prioridade de localização**:
  1. Se **Coordenadas de Debug** estiver ativado em **Configurações**, utiliza as coordenadas manuais configuradas (validadas em `[-90, 90]` e `[-180, 180]`).
  2. Caso contrário, utiliza a geolocalização real do navegador (`navigator.geolocation.getCurrentPosition`), tratando permissões negadas, indisponibilidade e timeout sem inventar coordenadas.
- **Descanso na Home**: Aplica a fórmula `vidaAtual = Math.max(vidaAtual, Math.round(vidaMaxima * 0.5))`, garantindo ao menos 50% da Vida máxima sem reduzir a vida caso já esteja acima de 50% e sem alterar vida máxima, energia ou moedas.

### 3.2. Atributos, Deslocamento, Energia e Checkpoints
- **Cálculo de atributos finais** (centralizado em `Backend/Services/PlayerStatsCalculator.cs` e sincronizado em `Frontend/src/services/playerApi.js`):
  - Soma atributos base do jogador, bônus permanentes de treinamento (`Sports`), bônus de itens equipados nos 7 slots e bônus de buffs temporários ativos (`BuffsJogador`).
  - **Consumo de Energia por km**: `10 / 2^(velocidadeFinal / 100)` (com base 10 PE/km reduzida progressivamente conforme a velocidade final).
  - **Chance de Esquiva**: `Math.min(75, Math.round((velocidadeFinal / (velocidadeFinal + 100)) * 75 * 10) / 10)`.
- **Emboscadas em rota**: Chance proporcional à distância da rota (`25% por km`, teto de `50%`).
- **Checkpoints independentes**:
  - **Checkpoint de Vida**: atualizado ao interagir com qualquer local de `Health and Wellness`.
  - **Checkpoint de Energia**: atualizado ao descansar em qualquer local de `Lodging`.
  - Em caso de derrota (`Vida = 0`) ou esgotamento (`Energia = 0`), o `RecoveryModal` permite retornar ao checkpoint correspondente ou à `Home`.

### 3.3. Combate e Iniciativa por Velocidade
- Sistema de combate por turnos com ações de **Atacar**, **Habilidade Especial (20 PE)**, **Defender (-50% dano recebido e +15 PE)** e **Fugir** (permitido em emboscadas).
- **Ordem de Iniciativa**: Definida pelo atributo **Velocidade** (`calcularOrdemIniciativa`), recalculada no início de cada combate e de cada ronda. Combatentes com maior Velocidade agem primeiro; empates são resolvidos de forma determinística (jogador antes de inimigo; entre inimigos, pela ordem da ronda e identificador).

### 3.4. Comportamento por Categoria de Place
A classificação oficial está sincronizada entre `Backend/Services/PlaceCategoryMapper.cs` e `Frontend/src/utils/placeCategories.js`:

1. **Shopping (`shopping_mall`)**: Local especial de **Boss** urbano.
2. **Shopping (demais subcategorias)**: **Loja de Equipamentos** com geração determinística de 3 equipamentos por Place, compra única por slot de vitrine e integração direta com o inventário de equipamentos.
3. **Food and Drink**: **Loja de Consumíveis** com geração de 3 consumíveis por Place, compra de unidades de estoque e uso direto no inventário para recuperar Vida ou Energia.
4. **Services**: **Loja de Buff Temporário** (`50g`), com atributo fixo sorteado e persistido para cada Place (`+5 Dano`, `+20 Vida máxima`, `+30 Energia máxima` ou `+15 Velocidade` por 10 minutos).
5. **Health and Wellness**: **Hospital** com cura gratuita única por local (`+25%` ou `+50%` em `general_hospital`) e cura paga (`50g`).
6. **Lodging**: **Hospedagem** com recuperação de 100% da Energia por `25g`.
7. **Entertainment and Recreation**: **Arena** de combate em 3 rondas com recompensa de moedas e conclusão permanente do Place.
8. **Natural Features**: **Vasculhar local** (`beach`, `island`, `lake`, `mountain_peak`, `nature_preserve`, `river`, `scenic_spot`, `woods`) com sorteio único de moedas persistido no banco.
9. **Transportation**: **Viagem rápida entre terminais da mesma subcategoria**. Suporta exclusivamente as 24 subcategorias oficiais da Google Places API:
   `airport`, `airstrip`, `bike_sharing_station`, `bridge`, `bus_station`, `bus_stop`, `ferry_service`, `ferry_terminal`, `heliport`, `international_airport`, `light_rail_station`, `park_and_ride`, `subway_station`, `taxi_service`, `taxi_stand`, `toll_station`, `train_station`, `train_ticket_office`, `tram_stop`, `transit_depot`, `transit_station`, `transit_stop`, `transportation_service`, `truck_stop`.
   Realiza busca progressiva (`5 km → 15 km → 30 km → 50 km`) exclusivamente pela mesma subcategoria.
10. **Culture**: **Espaço Cultural** que concede gratuitamente um **Buff Cultural Temporário** único por Place (por 10 minutos), marcando o local como concluído.
11. **Sports**: **Treinamento físico permanente único por Place** (`+1 Dano`, `+5 Vida máxima`, `+10 Energia máxima` ou `+1 Velocidade`). Após a escolha, o Place é marcado como concluído (`Concluido = true`) e a melhoria escolhida fica registrada em `EstadosPermanentesPlaces`.

---

## 4. Diretrizes Técnicas e de Manutenção
- **Segurança e Chaves de API**: Nunca versione chaves reais no repositório. Leia sempre de variáveis de ambiente (`GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY`).
- **Sincronização Frontend/Backend**: Qualquer alteração em categorias de Places ou cálculo de atributos deve ser mantida em sincronia entre `Backend/` e `Frontend/src/`.
- **Código Limpo**: Mantenha o código direto, sem comentários desnecessários, sem arquivos duplicados e sem abstrações supérfluas.
- **Fluxo de Verificação Obrigatório**:
  1. `dotnet build Backend/GeoQuest.Api.csproj`
  2. `npm --prefix Frontend run lint`
  3. `npm --prefix Frontend run build`

---

> **REGRA DE MANUTENÇÃO DA DOCUMENTAÇÃO:** Toda vez que o código relacionado a este documento for alterado, este documento também deverá ser revisado e atualizado ao final da tarefa, caso necessário. Todo agente deve consultar a documentação antes de iniciar qualquer alteração e atualizá-la antes de concluir seu trabalho, garantindo que ela permaneça sincronizada com o código.
