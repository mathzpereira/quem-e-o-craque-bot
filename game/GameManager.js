const { getAllPlayers } = require('../database/mongodb');

let cachedPlayers = [];

class GameSession {
	constructor(channelId, playersData) {
		this.channelId = channelId;
		this.players = new Map(); // userId -> { username, score, ready, skipNextTurn, hasAnytimeGuess }
		this.currentPlayer = null;
		this.currentPlayerIndex = 0;
		this.playersData = playersData;
		this.currentCard = this.selectRandomPlayer();
		this.revealedHints = [];
		this.currentHintIndex = 0;
		this.isActive = false;
		this.hasUsedHint = false;
		this.messageId = null; // ID da mensagem principal do jogo
		this.lastSpecialHint = null;
	}

	selectRandomPlayer() {
		const randomIndex = Math.floor(Math.random() * this.playersData.length);
		const selectedPlayer = this.playersData[randomIndex];

		return {
			...selectedPlayer,
			hints: this.shuffleHints([...selectedPlayer.hints]),
		};
	}

	shuffleHints(hints) {
		const shuffled = [...hints];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	addPlayer(userId, username) {
		if (!this.players.has(userId)) {
			this.players.set(userId, {
				username,
				score: 0,
				ready: false,
				skipNextTurn: false,
				hasAnytimeGuess: false,
			});
			return true;
		}
		return false;
	}

	setPlayerReady(userId, ready = true) {
		if (this.players.has(userId)) {
			this.players.get(userId).ready = ready;
			return true;
		}
		return false;
	}

	allPlayersReady() {
		if (this.players.size === 0) return false;
		return Array.from(this.players.values()).every(p => p.ready);
	}

	getReadyCount() {
		return Array.from(this.players.values()).filter(p => p.ready).length;
	}

	start() {
		if (this.players.size < 1) {
			return false;
		}
		this.isActive = true;
		const playerIds = Array.from(this.players.keys());
		this.shuffleArray(playerIds);
		const shuffledPlayers = new Map();
		for (const id of playerIds) {
			shuffledPlayers.set(id, this.players.get(id));
		}
		this.players = shuffledPlayers;
		this.currentPlayer = playerIds[0];
		return true;
	}

	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	revealNextHint() {
		if (this.currentHintIndex < this.currentCard.hints.length) {
			const hintData = this.currentCard.hints[this.currentHintIndex];
			this.currentHintIndex++;
			this.hasUsedHint = true;

			if (hintData === 'skip_turn') {
				this.lastSpecialHint = { type: 'skip_turn', text: 'Perca sua vez.' };
				this.revealedHints.push(this.lastSpecialHint);
				return this.lastSpecialHint;
			}

			if (hintData === 'anytime_guess') {
				this.lastSpecialHint = { type: 'anytime_guess', text: 'Um palpite a qualquer hora.' };
				this.revealedHints.push(this.lastSpecialHint);
				return this.lastSpecialHint;
			}

			this.lastSpecialHint = null;
			this.revealedHints.push({ type: 'normal', text: hintData });
			return { type: 'normal', text: hintData };
		}
		return null;
	}

	applySpecialHint(specialHint) {
		if (!specialHint || specialHint.type === 'normal') return null;

		const player = this.players.get(this.currentPlayer);
		if (!player) return null;

		if (specialHint.type === 'skip_turn') {
			player.skipNextTurn = true;
			return {
				type: 'skip_turn',
				message: `<@${this.currentPlayer}> não poderá dar um palpite neste turno.`,
			};
		}

		if (specialHint.type === 'anytime_guess') {
			player.hasAnytimeGuess = true;
			return {
				type: 'anytime_guess',
				message: `<@${this.currentPlayer}> ganhou o poder de palpitar a qualquer hora!`,
			};
		}

		return null;
	}

	canPlayerGuess(userId) {
		const player = this.players.get(userId);
		if (!player) return false;

		if (player.hasAnytimeGuess && userId !== this.currentPlayer) {
			return true;
		}

		if (userId === this.currentPlayer) {
			return !player.skipNextTurn;
		}

		return false;
	}

	useAnytimeGuess(userId) {
		const player = this.players.get(userId);
		if (player && player.hasAnytimeGuess) {
			player.hasAnytimeGuess = false;
			return true;
		}
		return false;
	}

	checkAnswer(guess) {
		const normalizedGuess = guess.toLowerCase().trim();

		const names = Array.isArray(this.currentCard.name)
			? this.currentCard.name
			: [this.currentCard.name];

		return names.some(name => {
			const normalizedAnswer = String(name || '').toLowerCase().trim();
			return normalizedGuess === normalizedAnswer ||
			       normalizedAnswer.includes(normalizedGuess) ||
			       this.removeAccents(normalizedGuess) === this.removeAccents(normalizedAnswer);
		});
	}

	removeAccents(str) {
		return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	getPlayerName() {
		if (Array.isArray(this.currentCard.name)) {
			return this.currentCard.name[0];
		}
		return this.currentCard.name;
	}

	nextTurn() {
		const playerIds = Array.from(this.players.keys());

		const currentPlayer = this.players.get(this.currentPlayer);
		if (currentPlayer && currentPlayer.skipNextTurn) {
			currentPlayer.skipNextTurn = false;
		}

		this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerIds.length;
		this.currentPlayer = playerIds[this.currentPlayerIndex];
		this.hasUsedHint = false;
	}

	addScore(userId, points = 1) {
		if (this.players.has(userId)) {
			const player = this.players.get(userId);
			player.score += points;
		}
	}

	getCurrentPlayerName() {
		if (this.currentPlayer && this.players.has(this.currentPlayer)) {
			return this.players.get(this.currentPlayer).username;
		}
		return null;
	}

	getLeaderboard() {
		return Array.from(this.players.entries())
			.map(([userId, data]) => ({ userId, ...data }))
			.sort((a, b) => b.score - a.score);
	}

	end() {
		this.isActive = false;
	}
}

class GameManager {
	constructor() {
		this.sessions = new Map(); // channelId -> GameSession
		this.loadPlayers();
	}

	async loadPlayers() {
		try {
			cachedPlayers = await getAllPlayers();
		}
		catch (error) {
			console.error(error);
		}
	}

	async createSession(channelId) {
		if (this.sessions.has(channelId)) {
			return null;
		}

		if (cachedPlayers.length === 0) {
			await this.loadPlayers();
		}

		const session = new GameSession(channelId, cachedPlayers);
		this.sessions.set(channelId, session);
		return session;
	}

	getSession(channelId) {
		return this.sessions.get(channelId);
	}

	endSession(channelId) {
		const session = this.sessions.get(channelId);
		if (session) {
			session.end();
			this.sessions.delete(channelId);
			return true;
		}
		return false;
	}

	hasActiveSession(channelId) {
		return this.sessions.has(channelId) && this.sessions.get(channelId).isActive;
	}

	hasSession(channelId) {
		return this.sessions.has(channelId);
	}
}

const gameManager = new GameManager();

module.exports = { gameManager, GameSession };
