const players = require('../data/players.json');

class GameSession {
	constructor(channelId) {
		this.channelId = channelId;
		this.players = new Map(); // userId -> { username, score, ready }
		this.currentPlayer = null;
		this.currentPlayerIndex = 0;
		this.currentCard = this.selectRandomPlayer();
		this.revealedHints = [];
		this.currentHintIndex = 0;
		this.isActive = false;
		this.hasUsedHint = false;
		this.messageId = null; // ID da mensagem principal do jogo
	}

	selectRandomPlayer() {
		const randomIndex = Math.floor(Math.random() * players.players.length);
		return players.players[randomIndex];
	}

	addPlayer(userId, username) {
		if (!this.players.has(userId)) {
			this.players.set(userId, { username, score: 0, ready: false });
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
			const hint = this.currentCard.hints[this.currentHintIndex];
			this.revealedHints.push(hint);
			this.currentHintIndex++;
			this.hasUsedHint = true;
			return hint;
		}
		return null;
	}

	checkAnswer(guess) {
		const normalizedGuess = guess.toLowerCase().trim();
		const normalizedAnswer = this.currentCard.name.toLowerCase().trim();

		return normalizedGuess === normalizedAnswer ||
		       normalizedAnswer.includes(normalizedGuess) ||
		       this.removeAccents(normalizedGuess) === this.removeAccents(normalizedAnswer);
	}

	removeAccents(str) {
		return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	nextTurn() {
		const playerIds = Array.from(this.players.keys());
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
	}

	createSession(channelId) {
		if (this.sessions.has(channelId)) {
			return null;
		}
		const session = new GameSession(channelId);
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
