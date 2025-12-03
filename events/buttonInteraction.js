const { EmbedBuilder, MessageFlags } = require('discord.js');
const { gameManager } = require('../game/GameManager');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isButton()) return;

		const session = gameManager.getSession(interaction.channelId);

		if (interaction.customId === 'game_join') {
			if (!session) {
				return interaction.reply({
					content: '❌ Não há nenhum jogo neste canal!',
					flags: MessageFlags.Ephemeral,
				});
			}

			if (session.isActive) {
				return interaction.reply({
					content: '❌ O jogo já começou! Aguarde a próxima partida.',
					flags: MessageFlags.Ephemeral,
				});
			}

			const added = session.addPlayer(interaction.user.id, interaction.user.username);

			if (!added) {
				return interaction.reply({
					content: '⚠️ Você já está na partida!',
					flags: MessageFlags.Ephemeral,
				});
			}

			await updateGameMessage(interaction, session);

			await interaction.reply({
				content: `✅ <@${interaction.user.id}> entrou no jogo!`,
			});
		}

		if (interaction.customId === 'game_ready') {
			if (!session) {
				return interaction.reply({
					content: '❌ Não há nenhum jogo neste canal!',
					flags: MessageFlags.Ephemeral,
				});
			}

			if (session.isActive) {
				return interaction.reply({
					content: '❌ O jogo já começou!',
					flags: MessageFlags.Ephemeral,
				});
			}

			if (!session.players.has(interaction.user.id)) {
				return interaction.reply({
					content: '⚠️ Você precisa entrar no jogo primeiro! Clique em "Entrar".',
					flags: MessageFlags.Ephemeral,
				});
			}

			const player = session.players.get(interaction.user.id);

			if (player.ready) {
				return interaction.reply({
					content: '⚠️ Você já está pronto!',
					flags: MessageFlags.Ephemeral,
				});
			}

			session.setPlayerReady(interaction.user.id, true);

			await updateGameMessage(interaction, session);

			await interaction.deferUpdate();

			if (session.allPlayersReady()) {
				await startGame(interaction, session);
			}
		}
	},
};

async function updateGameMessage(interaction, session) {
	try {
		const message = await interaction.channel.messages.fetch(session.messageId);

		const playerList = Array.from(session.players.entries())
			.map(([userId, data]) => {
				const readyEmoji = data.ready ? '✅' : '⏳';
				return `${readyEmoji} <@${userId}>`;
			})
			.join('\n');

		const readyCount = session.getReadyCount();
		const totalPlayers = session.players.size;

		const embed = EmbedBuilder.from(message.embeds[0])
			.setFields(
				{ name: '👥 Jogadores', value: playerList, inline: true },
				{ name: '✅ Prontos', value: `${readyCount}/${totalPlayers}`, inline: true },
			);

		await message.edit({ embeds: [embed] });
	}
	catch (error) {
		console.error('Erro ao atualizar mensagem do jogo:', error);
	}
}

async function startGame(interaction, session) {
	session.start();

	const embed = new EmbedBuilder()
		.setColor(0xFFD700)
		.setTitle('🎮 O Jogo Começou!')
		.setDescription(
			'Todos os jogadores estão prontos! Vamos começar!\n\n' +
			`Existem **${session.currentCard.hints.length} dicas** sobre o craque misterioso.`,
		)
		.addFields(
			{
				name: '🎯 Ordem dos Jogadores',
				value: Array.from(session.players.keys()).map((id, i) => `${i + 1}. <@${id}>`).join('\n'),
				inline: true,
			},
			{
				name: '🎮 Turno Atual',
				value: `<@${session.currentPlayer}>`,
				inline: true,
			},
		)
		.setFooter({ text: 'Use /dica <número> para revelar uma dica ou /palpite <nome> para dar seu palpite!' })
		.setTimestamp();

	await interaction.channel.send({ embeds: [embed] });

	try {
		const message = await interaction.channel.messages.fetch(session.messageId);
		await message.edit({ components: [] });
	}
	catch (error) {
		console.error('Erro ao remover botões:', error);
	}
}
