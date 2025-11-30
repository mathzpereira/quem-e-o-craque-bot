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

		if (session.currentPlayer !== interaction.user.id) {
			return interaction.reply({
				content: `⏳ Aguarde sua vez! É a vez de <@${session.currentPlayer}>.`,
				ephemeral: true,
			});
		}

		if (session.hasUsedHint) {
			return interaction.reply({
				content: '⚠️ Você já revelou uma dica neste turno! Agora use `/palpite <nome>` para dar seu palpite.',
				ephemeral: true,
			});
		}

		const hintData = session.revealNextHint();

		if (!hintData) {
			return interaction.reply({
				content: '❌ Todas as dicas já foram reveladas! Use `/palpite <nome>` para dar seu palpite.',
				ephemeral: true,
			});
		}

		const specialEffect = session.applySpecialHint(hintData);

		const isSkipTurn = hintData.type === 'skip_turn';

		const embed = new EmbedBuilder()
			.setColor(hintData.type !== 'normal' ? 0xFF6B00 : 0xFFD700)
			.setTitle(hintData.type !== 'normal' ? '⚡ Dica Especial Revelada!' : '🔍 Nova Dica Revelada!')
			.setDescription(`**Dica ${session.currentHintIndex}/${session.currentCard.hints.length}:**\n${hintData.text}`)
			.addFields(
				{
					name: '💡 Dicas Reveladas',
					value: session.revealedHints.map((h, i) => {
						const icon = h.type === 'normal' ? '💡' : h.type === 'skip_turn' ? '⚠️' : '🌟';
						return `${icon} ${i + 1}. ${h.text}`;
					}).join('\n') || 'Nenhuma',
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

		if (specialEffect) {
			embed.addFields({
				name: '⚡ Efeito Aplicado',
				value: specialEffect.message,
				inline: false,
			});
		}

		await interaction.reply({ embeds: [embed] });

		if (isSkipTurn) {
			session.nextTurn();

			await interaction.followUp({
				content: `➡️ Turno pulado! Agora é a vez de <@${session.currentPlayer}>! Use \`/dica\` para revelar uma dica ou \`/palpite\` se já souber a resposta.`,
			});
		}
	},
};
