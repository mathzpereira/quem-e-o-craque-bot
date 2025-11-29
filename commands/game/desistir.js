const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('desistir')
		.setDescription('Encerra o jogo atual e revela a resposta'),

	async execute(interaction) {
		const channelId = interaction.channelId;
		const session = gameManager.getSession(channelId);

		if (!session) {
			return interaction.reply({
				content: '❌ Não há nenhum jogo ativo neste canal!',
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setColor(0xFF6B6B)
			.setTitle('🏳️ Jogo Encerrado!')
			.setDescription(
				`O jogo foi encerrado por <@${interaction.user.id}>.\n\n` +
				`**O craque era:** ${session.currentCard.name}`,
			)
			.addFields(
				{
					name: '💡 Todas as Dicas',
					value: session.currentCard.hints.map((h, i) => `${i + 1}. ${h}`).join('\n'),
					inline: false,
				},
				{
					name: '🔍 Dicas que foram reveladas',
					value: session.revealedHints.length > 0
						? session.revealedHints.map((h, i) => `${i + 1}. ${h}`).join('\n')
						: 'Nenhuma dica foi revelada',
					inline: false,
				},
			)
			.setFooter({ text: 'Use /jogar para iniciar um novo jogo!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });

		// Encerra a sessão
		gameManager.endSession(channelId);
	},
};
