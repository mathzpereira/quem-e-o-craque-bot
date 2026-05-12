# Quem é o Craque? ⚽

Bot de Discord com jogo de adivinhação de jogadores de futebol usando slash commands, botões interativos e cards armazenados no MongoDB.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack e requisitos](#stack-e-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Primeira execução](#primeira-execução)
- [Como jogar](#como-jogar)
- [Comandos](#comandos)
- [Arquitetura resumida](#arquitetura-resumida)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Licença](#licença)

## Funcionalidades

- Partidas por canal do Discord (uma sessão ativa por canal).
- Lobby com botões **Entrar** e **Pronto**.
- Ordem de turno aleatória.
- Revelação de dicas por número (`/dica <numero>`).
- Palpite por turno (`/palpite <nome>`).
- Dicas especiais suportadas nos cards:
  - `skip_turn` (perde o palpite do turno)
  - `anytime_guess` (palpite fora do turno, uso único)
- Encerramento manual com revelação da resposta (`/desistir`).

## Stack e requisitos

- Node.js (LTS recomendado)
- MongoDB
- Discord.js v14

Dependências principais:

- `discord.js`
- `mongodb`
- `dotenv`

## Instalação

```bash
git clone https://github.com/mathzpereira/quem-e-o-craque-bot.git
cd quem-e-o-craque-bot
npm install
```

## Configuração

Crie um arquivo `.env` na raiz (ou use o `.env.example` como base):

```env
DISCORD_TOKEN=seu_token_do_bot
DISCORD_CLIENT_ID=seu_application_id
DISCORD_GUILD_ID=seu_guild_id_de_desenvolvimento
MONGO_URI=sua_connection_string_mongodb
MONGO_DATABASE=quem-e-o-craque
```

### Onde obter cada valor

- `DISCORD_TOKEN`: Discord Developer Portal → Application → **Bot**.
- `DISCORD_CLIENT_ID`: Discord Developer Portal → **General Information** → Application ID.
- `DISCORD_GUILD_ID`: ID do servidor (Developer Mode habilitado no Discord).
- `MONGO_URI` e `MONGO_DATABASE`: instância MongoDB usada pelo projeto.

## Primeira execução

1. Registrar slash commands no servidor de desenvolvimento:

```bash
node deploy-commands.js
```

2. Popular o banco com cards iniciais:

```bash
node seed-cards.js
```

3. Iniciar o bot:

```bash
node index.js
```

## Como jogar

1. Use `/jogar` para criar a partida no canal.
2. Jogadores entram no lobby com o botão **Entrar**.
3. Todos marcam **Pronto**.
4. Com a partida iniciada:
   - no turno, revele uma dica com `/dica <numero>`;
   - em seguida, tente adivinhar com `/palpite <nome>`.
5. Para encerrar e revelar o craque, use `/desistir`.

## Comandos

| Comando | Descrição |
| --- | --- |
| `/jogar` | Cria uma nova sessão de jogo no canal atual |
| `/dica <numero>` | Revela a dica do número informado (1 a 10) |
| `/palpite <nome>` | Tenta adivinhar o jogador da rodada |
| `/desistir` | Encerra a sessão atual e revela a resposta |

## Arquitetura resumida

- `index.js`: bootstrap do bot, conexão com MongoDB, carregamento dinâmico de comandos/eventos.
- `deploy-commands.js`: registro de slash commands via REST.
- `game/GameManager.js`:
  - gerencia sessões em memória por `channelId`;
  - controla turnos, regras e validação de resposta;
  - aplica efeitos de dicas especiais.
- `database/mongodb.js`: conexão e acesso à coleção `players`.
- `seed-cards.js`: script idempotente para inserir/atualizar cards por `cardId`.

## Estrutura do projeto

```text
.
├── commands/game/         # Slash commands do jogo
├── events/                # Handlers de eventos do Discord
├── game/                  # Núcleo de regras e estado da sessão
├── database/              # Conexão e acesso ao MongoDB
├── deploy-commands.js     # Registro de comandos no Discord
├── seed-cards.js          # Carga inicial/atualização de cards
└── index.js               # Entrada principal do bot
```

## Troubleshooting

### `MONGO_URI and MONGO_DATABASE must be defined`

As variáveis de ambiente do MongoDB não foram carregadas corretamente. Revise o `.env`.

### Comandos não aparecem no servidor

- Confirme `DISCORD_CLIENT_ID` e `DISCORD_GUILD_ID`.
- Rode novamente:

```bash
node deploy-commands.js
```

### Bot não inicia com erro de token

Verifique `DISCORD_TOKEN` e se o token é do bot correto no Developer Portal.

## Roadmap

- Ranking persistente
- Mais cards e categorias
- Estatísticas por jogador
- Modos adicionais de jogo

## Licença

Projeto educacional para aprendizado de Discord.js.
