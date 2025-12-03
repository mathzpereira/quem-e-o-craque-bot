const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dica')
		.setDescription('Revela uma dica sobre o craque')
		.addIntegerOption(option =>
			option
				.setName('numero')
				.setDescription('Número da dica (1-10)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10)),

	async execute(interaction) {
		const channelId = interaction.channelId;
		const session = gameManager.getSession(channelId);

		if (!session) {
			return interaction.reply({
				content: '❌ Não há nenhum jogo ativo neste canal! Use `/jogar` para iniciar um novo jogo.',
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!session.isActive) {
			return interaction.reply({
				content: '⚠️ O jogo ainda não começou! Aguarde todos os jogadores ficarem prontos.',
				flags: MessageFlags.Ephemeral,
			});
		}

		if (session.currentPlayer !== interaction.user.id) {
			return interaction.reply({
				content: `⏳ Aguarde sua vez! É a vez de <@${session.currentPlayer}>.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		if (session.hasUsedHint) {
			return interaction.reply({
				content: '⚠️ Você já revelou uma dica neste turno! Agora use `/palpite <nome>` para dar seu palpite.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const hintNumber = interaction.options.getInteger('numero');
		const hintData = session.revealHintByNumber(hintNumber);	if (!hintData) {
			return interaction.reply({
				content: '❌ Esta dica já foi revelada! Escolha outro número.',
				flags: MessageFlags.Ephemeral,
			});
		}		const specialEffect = session.applySpecialHint(hintData);

		const isSkipTurn = hintData.type === 'skip_turn';

		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setTitle('🔍 Nova Dica Revelada!')
			.setDescription(`**Dica ${hintNumber}:**\n${hintData.text}`)
			.addFields(
				{
					name: '💡 Dicas Reveladas',
					value: session.revealedHints
						.sort((a, b) => a.number - b.number)
						.map(h => {
							const icon = h.type === 'normal' ? '💡' : h.type === 'skip_turn' ? '⚠️' : '🌟';
							return `${icon} ${h.number}. ${h.text}`;
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
				content: `➡️ Turno pulado! Agora é a vez de <@${session.currentPlayer}>! Use \`/dica <número>\` para revelar uma dica ou \`/palpite\` se já souber a resposta.`,
			});
		}
	},
};
