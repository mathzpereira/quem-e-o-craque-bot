const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
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
				flags: MessageFlags.Ephemeral,
			});
		}

		const embed = new EmbedBuilder()
			.setColor(0xFF6B6B)
			.setTitle('🏳️ Jogo Encerrado!')
			.setDescription(
				`O jogo foi encerrado por <@${interaction.user.id}>.\n\n` +
				`**O craque era:** ${session.getPlayerName()}`,
			)
			.addFields(
				{
					name: '💡 Todas as Dicas',
					value: session.currentCard.hints.map((h, i) => {
						if (h === 'skip_turn') {
							return `⚠️ ${i + 1}. Perca sua vez.`;
						}
						if (h === 'anytime_guess') {
							return `🌟 ${i + 1}. Um palpite a qualquer hora.`;
						}
						return `💡 ${i + 1}. ${h}`;
					}).join('\n'),
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

		gameManager.endSession(channelId);
	},
};
