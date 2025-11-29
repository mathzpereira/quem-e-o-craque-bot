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

		// Inicia o jogo se ainda não foi iniciado
		if (!session.isActive) {
			session.start();
		}

		// Verifica se é a vez do jogador
		if (session.currentPlayer !== interaction.user.id) {
			const currentPlayerName = session.getCurrentPlayerName();
			return interaction.reply({
				content: `⏳ Aguarde sua vez! É a vez de **${currentPlayerName}**.`,
				ephemeral: true,
			});
		}

		// Verifica se o jogador revelou pelo menos uma dica
		if (!session.hasUsedHint && session.revealedHints.length === 0) {
			return interaction.reply({
				content: '⚠️ Você precisa revelar pelo menos uma dica antes de dar um palpite! Use `/dica` primeiro.',
				ephemeral: true,
			});
		}

		// Verifica a resposta
		const isCorrect = session.checkAnswer(guess);

		if (isCorrect) {
			// Jogador acertou!
			session.addScore(interaction.user.id, 1);
			const leaderboard = session.getLeaderboard();

			const leaderboardText = leaderboard
				.map((p, i) => `${i + 1}. **${p.username}** - ${p.score} ponto(s)`)
				.join('\n');

			const embed = new EmbedBuilder()
				.setColor(0x00FF00)
				.setTitle('🎉 ACERTOU! 🎉')
				.setDescription(
					`**<@${interaction.user.id}>** descobriu que o craque é **${session.currentCard.name}**!\n\n` +
					`🏆 **Placar Final:**\n${leaderboardText}`,
				)
				.addFields(
					{
						name: '💡 Todas as Dicas',
						value: session.currentCard.hints.map((h, i) => `${i + 1}. ${h}`).join('\n'),
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
			// Resposta incorreta - passa para o próximo jogador
			const embed = new EmbedBuilder()
				.setColor(0xFF0000)
				.setTitle('❌ Resposta Incorreta!')
				.setDescription(
					`**<@${interaction.user.id}>** palpitou **${guess}**, mas não é o craque que estamos procurando!\n\n` +
					'Passando para o próximo jogador...',
				)
				.addFields(
					{
						name: '💡 Dicas Reveladas até agora',
						value: session.revealedHints.map((h, i) => `${i + 1}. ${h}`).join('\n') || 'Nenhuma',
						inline: false,
					},
				)
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

			// Próximo turno
			session.nextTurn();

			// Anuncia o próximo jogador
			const nextPlayerName = session.getCurrentPlayerName();
			await interaction.followUp({
				content: `🎮 É a vez de **${nextPlayerName}**! Use \`/dica\` para revelar uma dica ou \`/palpite\` se já souber a resposta.`,
			});
		}
	},
};
