const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jogar')
		.setDescription('Inicia um novo jogo de "Quem é o Craque?"'),

	async execute(interaction) {
		const channelId = interaction.channelId;

		if (gameManager.hasActiveSession(channelId)) {
			return interaction.reply({
				content: '❌ Já existe um jogo ativo neste canal! Use `/desistir` para encerrar o jogo atual.',
				ephemeral: true,
			});
		}

		const session = gameManager.createSession(channelId);
		if (!session) {
			return interaction.reply({
				content: '❌ Erro ao criar a sessão do jogo.',
				ephemeral: true,
			});
		}

		session.addPlayer(interaction.user.id, interaction.user.username);

		const embed = new EmbedBuilder()
			.setColor(0x00FF00)
			.setTitle('⚽ Quem é o Craque? ⚽')
			.setDescription(
				'Um novo jogo foi criado!\n\n' +
				'**Como jogar:**\n' +
				'🎮 Use `/entrar` para participar do jogo\n' +
				'🔍 Use `/dica` para revelar uma dica (uma por turno)\n' +
				'💭 Use `/palpite <nome>` para dar seu palpite\n' +
				'❌ Use `/desistir` para encerrar o jogo\n\n' +
				'O jogo começará automaticamente quando o primeiro jogador pedir uma dica ou der um palpite!',
			)
			.addFields(
				{ name: '👥 Jogadores', value: `<@${interaction.user.id}>`, inline: true },
				{ name: '📊 Status', value: 'Aguardando jogadores...', inline: true },
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
