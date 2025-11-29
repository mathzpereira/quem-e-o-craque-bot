const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dica')
		.setDescription('Revela a próxima dica sobre o craque'),

	async execute(interaction) {
		const channelId = interaction.channelId;
		const session = gameManager.getSession(channelId);

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

		// Verifica se é a vez do jogador
		if (session.currentPlayer !== interaction.user.id) {
			return interaction.reply({
				content: `⏳ Aguarde sua vez! É a vez de <@${session.currentPlayer}>.`,
				ephemeral: true,
			});
		}

		// Verifica se o jogador já usou a dica neste turno
		if (session.hasUsedHint) {
			return interaction.reply({
				content: '⚠️ Você já revelou uma dica neste turno! Agora use `/palpite <nome>` para dar seu palpite.',
				ephemeral: true,
			});
		}

		// Revela a próxima dica
		const hint = session.revealNextHint();

		if (!hint) {
			return interaction.reply({
				content: '❌ Todas as dicas já foram reveladas! Use `/palpite <nome>` para dar seu palpite.',
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setTitle('🔍 Nova Dica Revelada!')
			.setDescription(`**Dica ${session.currentHintIndex}/${session.currentCard.hints.length}:**\n${hint}`)
			.addFields(
				{
					name: '💡 Dicas Reveladas',
					value: session.revealedHints.map((h, i) => `${i + 1}. ${h}`).join('\n') || 'Nenhuma',
					inline: false,
				},
				{
					name: '🎮 Turno Atual',
					value: `<@${session.currentPlayer}>`,
					inline: true,
				},
			)
			.setFooter({ text: 'Use /palpite <nome> para dar seu palpite!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
