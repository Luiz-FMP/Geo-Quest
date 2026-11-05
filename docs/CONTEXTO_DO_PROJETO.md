# Geo Quest — Contexto Completo do Projeto

## 1. Visão Geral do Produto
**Geo Quest** é um jogo web de exploração baseada em localização real. Pontos de interesse do mundo real obtidos pela **Google Places API** tornam-se estabelecimentos interativos no mapa do jogo. O jogador se desloca fisicamente ou por rotas traçadas pela **Google Directions API**, gerencia **Vida**, **Energia** e **Moedas**, combate inimigos e bosses em turnos e evolui seus atributos permanentes.

---

## 2. Arquitetura Atual do Sistema

| Camada | Tecnologia | Responsabilidade Principal |
|---|---|---|
| **Frontend** | React 19 + Vite + `@vis.gl/react-google-maps` | Interface do mapa, geolocalização do navegador, modais de interação com Places, lojas, inventário, combate em turnos e configurações de debug. |
| **Backend** | C# / ASP.NET Core (.NET 10) | Validação de regras de negócio, persistência de estado do jogador, integração com Google Places/Directions e geração de sessões de combate. |
| **Persistência** | SQLite (`Backend/geoquest.db`) + EF Core 10 | Armazenamento relacional persistente do jogador, atributos, mochila, equipamentos, checkpoints, histórico de visitas e estado permanente de cada Place (`PlacesEstadoJogador`). |

---

## 3. Estado Atual das Funcionalidades Implementadas

### 3.1. Home e Localização Inicial (com Coordenadas de Debug)
- A **Home** representa sempre a localização atual do usuário ao iniciar uma nova sessão (`forcarAtualizacao = true`), definindo tanto a `Home` quanto a posição inicial do personagem (`PosicaoAtualLatitude` / `PosicaoAtualLongitude`) com as mesmas coordenadas.
- **Prioridade de localização**:
  1. Se o modo **Coordenadas de Debug** estiver ativado em **Configurações**, utiliza as coordenadas manuais configuradas (validadas em `[-90, 90]` e `[-180, 180]`).
  2. Caso contrário, utiliza a geolocalização real do navegador (`navigator.geolocation.getCurrentPosition`), tratando permissões negadas, indisponibilidade e timeout sem inventar coordenadas.
- **Descanso na Home**: Aplica a fórmula `vidaAtual = Math.max(vidaAtual, Math.round(vidaMaxima * 0.5))`, garantindo ao menos 50% da Vida máxima sem reduzir a vida caso já esteja acima de 50% e sem alterar vida máxima, energia ou moedas.

### 3.2. Deslocamento, Energia e Checkpoints
- Deslocamento por rotas consome **5 pontos de Energia por quilômetro** (`5 PE/km`).
- Chance de **Emboscada** (combate aleatório) proporcional à distância da rota (`25% por km`, teto de `50%`).
- **Checkpoints independentes**:
  - **Checkpoint de Vida**: salvo ao visitar qualquer local de `Health and Wellness`.
  - **Checkpoint de Energia**: salvo ao descansar em qualquer local de `Lodging`.
  - Em caso de derrota (`Vida = 0`) ou esgotamento (`Energia = 0`), o `RecoveryModal` permite retornar ao checkpoint correspondente ou à `Home`.

### 3.3. Combate e Iniciativa por Velocidade
- Sistema de combate por turnos com ações de **Atacar**, **Habilidade Especial (20 PE)**, **Defender (-50% dano e +15 PE)** e **Fugir** (permitido em emboscadas).
- **Ordem de Iniciativa**: Definida pelo atributo **Velocidade** (`calcularOrdemIniciativa`), recalculada no início de cada combate e de cada ronda. Combatentes com maior Velocidade agem primeiro; empates são resolvidos de forma determinística (jogador antes de inimigo; entre inimigos, pela ordem original da ronda e identificador).

### 3.4. Comportamento por Categoria de Place
1. **Shopping (`shopping_mall`)**: Local especial de **Boss** urbano.
2. **Shopping (demais subcategorias)**: **Loja de Equipamentos** (vitrine estrutural superior + inventário de equipamentos inferior; sem venda funcional nesta etapa).
3. **Food and Drink**: **Loja de Consumíveis** (vitrine estrutural superior + inventário de consumíveis inferior; sem venda funcional nesta etapa).
4. **Services**: **Loja de Buffs (`WIP`)** com interface estilo hospedagem e custo exibido de `50g` (em desenvolvimento, sem descontar moedas ou aplicar efeitos).
5. **Health and Wellness**: **Hospital** com cura gratuita única por local (`+25%` ou `+50%` em `general_hospital`) e cura paga (`50g`).
6. **Lodging**: **Hospedagem** com recuperação de 100% da Energia por `25g`.
7. **Entertainment and Recreation**: **Arena** de combate em 3 rondas.
8. **Natural Features**: **Vasculhar local** (`beach`, ` island`, `lake`, `mountain_peak`, `nature_preserve`, `river`, `scenic_spot`, `woods`) com sorteio e persistência de moedas no backend.
9. **Transportation**: **Viagem rápida entre terminais da mesma subcategoria**. Suporta exclusivamente as 24 subcategorias oficiais da Google Places API:
   `airport`, `airstrip`, `bike_sharing_station`, `bridge`, `bus_station`, `bus_stop`, `ferry_service`, `ferry_terminal`, `heliport`, `international_airport`, `light_rail_station`, `park_and_ride`, `subway_station`, `taxi_service`, `taxi_stand`, `toll_station`, `train_station`, `train_ticket_office`, `tram_stop`, `transit_depot`, `transit_station`, `transit_stop`, `transportation_service`, `truck_stop`.
   Realiza busca progressiva (`5 km → 15 km → 30 km → 50 km`) exclusivamente pela mesma subcategoria, ocultando o menu principal enquanto o mapa de transporte está aberto.
10. **Culture**: **Espaço Cultural (`WIP`)** que exibe o placeholder de buff cultural (`Nada` / `WIP`).
11. **Sports**: **Treinamento físico permanente único por Place** (`+1 Dano`, `+5 Vida máxima`, `+10 Energia máxima` ou `+1 Velocidade`). Após a escolha, o Place é marcado como concluído (`Concluido = true`) e a melhoria escolhida fica registrada no SQLite (`EstoqueJson` / `EstadoInteracao`), não permitindo repetir o treino no mesmo Place ao reabri-lo.

