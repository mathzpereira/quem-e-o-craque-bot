const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jogar')
		.setDescription('Inicia um novo jogo de "Quem é o Craque?"'),

	async execute(interaction) {
		const channelId = interaction.channelId;

		if (gameManager.hasSession(channelId)) {
			return interaction.reply({
				content: '❌ Já existe um jogo neste canal! Use `/desistir` para encerrar o jogo atual.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const session = gameManager.createSession(channelId);
		if (!session) {
			return interaction.reply({
				content: '❌ Erro ao criar a sessão do jogo.',
				flags: MessageFlags.Ephemeral,
			});
		}

		session.addPlayer(interaction.user.id, interaction.user.username);

		const embed = new EmbedBuilder()
			.setColor(0x00FF00)
			.setTitle('⚽ Quem é o Craque? ⚽')
			.setDescription(
				'Um novo jogo foi criado!\n\n' +
				'**Como jogar:**\n' +
				'🎮 Clique em **Entrar** para participar\n' +
				'✅ Clique em **Pronto** quando estiver pronto\n' +
				'🔍 Use `/dica` para revelar uma dica (uma por turno)\n' +
				'💭 Use `/palpite <nome>` para dar seu palpite\n' +
				'❌ Use `/desistir` para encerrar o jogo\n\n' +
				'⏳ O jogo começará automaticamente quando todos estiverem prontos!',
			)
			.addFields(
				{ name: '👥 Jogadores', value: `<@${interaction.user.id}>`, inline: true },
				{ name: '✅ Prontos', value: '0/1', inline: true },
			)
			.setTimestamp();

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('game_join')
					.setLabel('Entrar')
					.setEmoji('🎮')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('game_ready')
					.setLabel('Pronto')
					.setEmoji('✅')
					.setStyle(ButtonStyle.Success),
			);

		const message = await interaction.reply({ embeds: [embed], components: [row] }).withResponse();
		session.messageId = message.id;
	},
};
