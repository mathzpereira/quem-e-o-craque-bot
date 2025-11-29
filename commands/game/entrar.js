const { SlashCommandBuilder } = require('discord.js');
const { gameManager } = require('../../game/GameManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('entrar')
		.setDescription('Entra no jogo ativo do canal'),

	async execute(interaction) {
		const channelId = interaction.channelId;
		const session = gameManager.getSession(channelId);

		if (!session) {
			return interaction.reply({
				content: '❌ Não há nenhum jogo ativo neste canal! Use `/jogar` para iniciar um novo jogo.',
				ephemeral: true,
			});
		}

		if (session.isActive) {
			return interaction.reply({
				content: '❌ O jogo já começou! Aguarde o próximo jogo.',
				ephemeral: true,
			});
		}

		const added = session.addPlayer(interaction.user.id, interaction.user.username);

		if (!added) {
			return interaction.reply({
				content: '⚠️ Você já está participando deste jogo!',
				ephemeral: true,
			});
		}

		const playerList = Array.from(session.players.values())
			.map(p => p.username)
			.join(', ');

		await interaction.reply({
			content: `✅ <@${interaction.user.id}> entrou no jogo!\n\n👥 **Jogadores:** ${playerList}`,
		});
	},
};
