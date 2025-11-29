# ⚽ Quem é o Craque? - Bot do Discord

Um jogo interativo de adivinhação de jogadores de futebol para Discord, inspirado no jogo de tabuleiro **Perfil**.

## 🎮 Como Jogar

1. **Iniciar o jogo**: Use `/jogar` para criar uma nova partida no canal
2. **Entrar no jogo**: Outros jogadores usam `/entrar` para participar
3. **Revelar dicas**: No seu turno, use `/dica` para revelar uma pista sobre o jogador misterioso
4. **Dar palpite**: Use `/palpite <nome>` para tentar adivinhar quem é o craque
5. **Desistir**: Use `/desistir` para encerrar o jogo e revelar a resposta

## 📋 Regras

- Cada jogador tem um turno por rodada
- Em cada turno, você pode revelar UMA dica E dar UM palpite
- Se errar, passa a vez para o próximo jogador
- O primeiro a acertar ganha o ponto!
- Há 5 dicas progressivas, das mais genéricas às mais específicas

## 🤖 Comandos Disponíveis

### Comandos do Jogo
- `/jogar` - Inicia uma nova partida
- `/entrar` - Entra em uma partida existente (antes de começar)
- `/dica` - Revela a próxima dica (uma por turno)
- `/palpite <nome>` - Dá seu palpite sobre quem é o craque
- `/desistir` - Encerra o jogo atual

## 🏗️ Estrutura do Projeto

```
quem-e-o-craque-bot/
├── commands/
│   ├── game/           # Comandos do jogo
│   │   ├── jogar.js
│   │   ├── entrar.js
│   │   ├── dica.js
│   │   ├── palpite.js
│   │   └── desistir.js
├── data/
│   └── players.json    # Banco de dados de jogadores
├── events/             # Event handlers do Discord
├── game/
│   └── GameManager.js  # Lógica principal do jogo
├── deploy-commands.js  # Script para registrar comandos
└── index.js           # Ponto de entrada
```

## 🚀 Instalação e Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o `config.json` com suas credenciais do Discord
4. Registre os comandos:
   ```bash
   node deploy-commands.js
   ```
5. Inicie o bot:
   ```bash
   node index.js
   ```

## 🎯 Jogadores Disponíveis

O jogo inclui 10 craques do futebol mundial:
- Cristiano Ronaldo
- Lionel Messi
- Neymar Jr
- Pelé
- Ronaldo Fenômeno
- Ronaldinho Gaúcho
- Zinedine Zidane
- Karim Benzema
- Vinicius Junior
- Romário

## 📦 Tecnologias

- **Node.js** - Runtime JavaScript
- **Discord.js v14** - Biblioteca para interagir com a API do Discord
- **ESLint** - Linter para manter código limpo

## 🔜 Próximas Funcionalidades

- [ ] Sistema de ranking persistente
- [ ] Mais jogadores no banco de dados
- [ ] Categorias (brasileiros, europeus, lendas, etc)
- [ ] Modo solo contra o bot
- [ ] Dificuldades diferentes
- [ ] Estatísticas por jogador

## 📝 Licença

Projeto educacional para aprendizado de Discord.js