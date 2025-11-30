const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('palpite')
		.setDescription('Dá seu palpite sobre quem é o craque')
		.addStringOption(option =>
			option
				.setName('nome')
				.setDescription('Nome do jogador que você acha que é')
				.setRequired(true)),

	async execute(interaction) {
		const channelId = interaction.channelId;
		const session = gameManager.getSession(channelId);
		const guess = interaction.options.getString('nome');

		if (!session) {
			return interaction.reply({
				content: '❌ Não há nenhum jogo ativo neste canal! Use `/jogar` para iniciar um novo jogo.',
				ephemeral: true,
			});
		}

		if (!session.isActive) {
			return interaction.reply({
				content: '⚠️ O jogo ainda não começou! Aguarde todos os jogadores ficarem prontos.',
				ephemeral: true,
			});
		}

		const player = session.players.get(interaction.user.id);
		const isUsingPower = player && player.hasAnytimeGuess && session.currentPlayer !== interaction.user.id;

		if (!session.canPlayerGuess(interaction.user.id)) {
			if (session.currentPlayer !== interaction.user.id && !isUsingPower) {
				return interaction.reply({
					content: `⏳ Aguarde sua vez! É a vez de <@${session.currentPlayer}>.`,
					ephemeral: true,
				});
			}

			if (player && player.skipNextTurn) {
				return interaction.reply({
					content: '😱 Você não pode dar palpite neste turno! Você revelou uma dica "Perca sua vez".',
					ephemeral: true,
				});
			}
		}

		if (!isUsingPower && !session.hasUsedHint && session.revealedHints.length === 0) {
			return interaction.reply({
				content: '⚠️ Você precisa revelar pelo menos uma dica antes de dar um palpite! Use `/dica` primeiro.',
				ephemeral: true,
			});
		}

		const usedPower = isUsingPower ? session.useAnytimeGuess(interaction.user.id) : false;

		const isCorrect = session.checkAnswer(guess);

		if (isCorrect) {
			session.addScore(interaction.user.id, 1);
			const leaderboard = session.getLeaderboard();

			const leaderboardText = leaderboard
				.map((p, i) => `${i + 1}. **${p.username}** - ${p.score} ponto(s)`)
				.join('\n');

			const powerMessage = usedPower ? '\n\n🌟 **Usou poder especial para palpitar fora do turno!**' : '';

			const embed = new EmbedBuilder()
				.setColor(0x00FF00)
				.setTitle('🎉 ACERTOU! 🎉')
				.setDescription(
					`**<@${interaction.user.id}>** descobriu que o craque é **${session.currentCard.name}**!${powerMessage}\n\n` +
					`🏆 **Placar Final:**\n${leaderboardText}`,
				)
				.addFields(
					{
						name: '💡 Todas as Dicas',
						value: session.currentCard.hints.map((h, i) => {
							if (typeof h === 'object') {
								const icon = h.type === 'skip_turn' ? '⚠️' : '🌟';
								return `${icon} ${i + 1}. ${h.text}`;
							}
							return `💡 ${i + 1}. ${h}`;
						}).join('\n'),
						inline: false,
					},
				)
				.setFooter({ text: 'Use /jogar para iniciar um novo jogo!' })
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

			// Encerra a sessão
			gameManager.endSession(channelId);
		}
		else {
			const powerMessage = usedPower ? ' usando seu poder especial' : '';

			const embed = new EmbedBuilder()
				.setColor(0xFF0000)
				.setTitle('❌ Resposta Incorreta!')
				.setDescription(
					`**<@${interaction.user.id}>** palpitou **${guess}**${powerMessage}, mas não é o craque que estamos procurando!\n\n` +
					(usedPower ? '🌟 Poder especial foi consumido.\n\n' : '') +
					'Passando para o próximo jogador...',
				)
				.addFields(
					{
						name: '💡 Dicas Reveladas até agora',
						value: session.revealedHints.map((h, i) => {
							const icon = h.type === 'normal' ? '💡' : h.type === 'skip_turn' ? '⚠️' : '🌟';
							return `${icon} ${i + 1}. ${h.text}`;
						}).join('\n') || 'Nenhuma',
						inline: false,
					},
				)
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

			if (!usedPower) {
				session.nextTurn();

				await interaction.followUp({
					content: `🎮 É a vez de <@${session.currentPlayer}>! Use \`/dica\` para revelar uma dica ou \`/palpite\` se já souber a resposta.`,
				});
			}
			else {
				await interaction.followUp({
					content: `🎮 Ainda é a vez de <@${session.currentPlayer}>.`,
				});
			}
		}
	},
};
