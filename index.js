const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { connectDB, closeDB } = require('./database/mongodb');

if (fs.existsSync('.env')) {
	require('dotenv').config();
}

const token = process.env.DISCORD_TOKEN || require('./config.json').token;
const port = Number(process.env.PORT);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

connectDB().catch(error => {
	console.error(error);
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

process.on('SIGINT', async () => {
	console.log('\n🛑 Encerrando bot...');
	await closeDB();
	process.exit(0);
});

if (Number.isInteger(port) && port > 0) {
	const healthServer = http.createServer((req, res) => {
		if (req.url === '/health') {
			const payload = {
				status: 'ok',
				discordReady: client.isReady(),
			};
			res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify(payload));
			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('Quem e o Craque bot is running');
	});

	healthServer.listen(port, () => {
		console.log(`🌐 Healthcheck HTTP disponível na porta ${port}`);
	});
}

client.login(token);