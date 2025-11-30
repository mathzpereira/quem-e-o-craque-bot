const { EmbedBuilder } = require('discord.js');
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
					ephemeral: true,
				});
			}

			if (session.isActive) {
				return interaction.reply({
					content: '❌ O jogo já começou! Aguarde a próxima partida.',
					ephemeral: true,
				});
			}

			const added = session.addPlayer(interaction.user.id, interaction.user.username);

			if (!added) {
				return interaction.reply({
					content: '⚠️ Você já está na partida!',
					ephemeral: true,
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
					ephemeral: true,
				});
			}

			if (session.isActive) {
				return interaction.reply({
					content: '❌ O jogo já começou!',
					ephemeral: true,
				});
			}

			if (!session.players.has(interaction.user.id)) {
				return interaction.reply({
					content: '⚠️ Você precisa entrar no jogo primeiro! Clique em "Entrar".',
					ephemeral: true,
				});
			}

			const player = session.players.get(interaction.user.id);

			if (player.ready) {
				return interaction.reply({
					content: '⚠️ Você já está pronto!',
					ephemeral: true,
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

	const firstHint = session.revealNextHint();
	const specialEffect = session.applySpecialHint(firstHint);

	const embed = new EmbedBuilder()
		.setColor(firstHint.type !== 'normal' ? 0xFF6B00 : 0xFFD700)
		.setTitle('🎮 O Jogo Começou!')
		.setDescription(
			'Todos os jogadores estão prontos! Vamos começar!\n\n' +
			`**Dica ${session.currentHintIndex}/${session.currentCard.hints.length}:**\n${firstHint.text}`,
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
		.setFooter({ text: 'Use /dica para mais dicas ou /palpite <nome> para dar seu palpite!' })
		.setTimestamp();

	if (specialEffect) {
		embed.addFields({
			name: '⚡ Efeito Aplicado',
			value: specialEffect.message,
			inline: false,
		});
	}

	await interaction.channel.send({ embeds: [embed] });

	try {
		const message = await interaction.channel.messages.fetch(session.messageId);
		await message.edit({ components: [] });
	}
	catch (error) {
		console.error('Erro ao remover botões:', error);
	}
}
