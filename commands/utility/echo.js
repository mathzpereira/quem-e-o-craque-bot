const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption((option) =>
			option
				.setName('input')
				.setDescription('The input to echo back')
				.setMaxLength(2_000),
		)
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to echo into')
				.addChannelTypes(ChannelType.GuildText),
		)
		.addBooleanOption((option) =>
			option.setName('ephemeral').setDescription('Whether or not the echo should be ephemeral'),
		)
		.addBooleanOption((option) => option.setName('embed').setDescription('Whether or not the echo should be embedded')),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		const ephemeral = interaction.options.getBoolean('ephemeral') || false;
		const embed = interaction.options.getBoolean('embed') || false;
		const replyOptions = {};
		if (embed) {
			replyOptions.embeds = [{ description: input }];
		}
		else {
			replyOptions.content = input;
		}
		if (channel.id === interaction.channel.id) {
			await interaction.reply({ ...replyOptions, ephemeral });
		}
		else {
			await channel.send(replyOptions);
			await interaction.reply({ content: `Message sent to ${channel}`, ephemeral: true });
		}
	},
};