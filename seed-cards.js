const fs = require('node:fs');
const { connectDB, getPlayersCollection, closeDB } = require('./database/mongodb');

if (fs.existsSync('.env')) {
	require('dotenv').config();
}

const cards = [
	{
		cardId: 'pele',
		name: ['Pelé', 'Edson Arantes do Nascimento'],
		hints: [
			'Nasci no Brasil.',
			'Fui atacante e virei símbolo mundial do futebol.',
			'Usei a camisa 10 em grandes momentos.',
			'Tenho três títulos de Copa do Mundo como jogador.',
			'skip_turn',
			'Fiquei marcado pelo Santos.',
			'Meu apelido é curto e muito famoso.',
			'Joguei também no New York Cosmos.',
			'Fui chamado de Rei do Futebol.',
			'Meu nome artístico é Pelé.',
		],
	},
	{
		cardId: 'ronaldo-nazario',
		name: ['Ronaldo', 'Ronaldo Nazário', 'Ronaldo Fenômeno'],
		hints: [
			'Nasci no Brasil.',
			'Atuei como centroavante.',
			'Passei por clubes como PSV, Barcelona, Inter, Real Madrid e Milan.',
			'Ganhei a Copa do Mundo de 2002.',
			'anytime_guess',
			'Fui duas vezes campeão da Copa América.',
			'Meu apelido remete a algo extraordinário.',
			'Meu corte de cabelo na final de 2002 ficou histórico.',
			'Marquei dois gols na final da Copa de 2002.',
			'Sou conhecido como Ronaldo Fenômeno.',
		],
	},
	{
		cardId: 'ronaldinho-gaucho',
		name: ['Ronaldinho Gaúcho', 'Ronaldinho', 'Ronaldo de Assis Moreira'],
		hints: [
			'Nasci no Brasil.',
			'Joguei no Grêmio, PSG, Barcelona e Milan.',
			'Fiquei conhecido por dribles e jogadas plásticas.',
			'Conquistei a Copa do Mundo de 2002.',
			'skip_turn',
			'Fui eleito melhor do mundo pela FIFA.',
			'Minha comemoração com sorriso virou marca registrada.',
			'Fiz parte de um Barcelona muito vencedor nos anos 2000.',
			'Meu apelido inclui uma referência ao sul do Brasil.',
			'Sou o Ronaldinho Gaúcho.',
		],
	},
	{
		cardId: 'neymar',
		name: ['Neymar', 'Neymar Jr', 'Neymar Júnior'],
		hints: [
			'Nasci no Brasil.',
			'Atuo como atacante.',
			'Passei por Santos, Barcelona, PSG e Al-Hilal.',
			'anytime_guess',
			'Conquistei uma Champions League.',
			'Ganhei medalha de ouro olímpica com a seleção brasileira.',
			'Tenho muitos gols pela seleção principal do Brasil.',
			'Fiquei muito conhecido por dribles curtos e velocidade.',
			'Meu nome artístico inclui "Jr" em várias fases da carreira.',
			'Sou o Neymar.',
		],
	},
	{
		cardId: 'marta',
		name: ['Marta', 'Marta Vieira da Silva'],
		hints: [
			'Nasci no Brasil.',
			'Atuo no futebol feminino.',
			'Joguei por muitos anos em alto nível internacional.',
			'Fui eleita melhor do mundo várias vezes.',
			'skip_turn',
			'anytime_guess',
			'Sou uma das maiores artilheiras da história da seleção brasileira.',
			'Fiquei conhecida mundialmente como referência técnica.',
			'Meu primeiro nome é curto e muito famoso no esporte.',
			'Sou a Marta.',
		],
	},
	{
		cardId: 'lionel-messi',
		name: ['Messi', 'Lionel Messi', 'Lionel Andrés Messi'],
		hints: [
			'Nasci na Argentina.',
			'Atuo como atacante e armador.',
			'Passei a maior parte da carreira europeia no Barcelona.',
			'Conquistei várias Bolas de Ouro.',
			'anytime_guess',
			'Ganhei a Copa América com a Argentina.',
			'Conquistei a Copa do Mundo de 2022.',
			'Fiquei famoso pelo drible curto com a perna esquerda.',
			'Usei a camisa 10 por muitos anos.',
			'Sou o Lionel Messi.',
		],
	},
	{
		cardId: 'cristiano-ronaldo',
		name: ['Cristiano Ronaldo', 'Cristiano', 'CR7'],
		hints: [
			'Nasci em Portugal.',
			'Atuo como atacante.',
			'Joguei por Sporting, Manchester United, Real Madrid, Juventus e Al-Nassr.',
			'skip_turn',
			'Ganhei a Eurocopa com Portugal.',
			'Fui eleito melhor do mundo várias vezes.',
			'Tenho muitos gols em Champions League.',
			'Minha comemoração "Siii" é muito conhecida.',
			'Meu apelido inclui o número 7.',
			'Sou o Cristiano Ronaldo.',
		],
	},
	{
		cardId: 'zinedine-zidane',
		name: ['Zidane', 'Zinedine Zidane'],
		hints: [
			'Nasci na França.',
			'Atuei como meio-campista.',
			'Joguei por Juventus e Real Madrid.',
			'Conquistei a Copa do Mundo de 1998.',
			'anytime_guess',
			'Ganhei a Eurocopa de 2000.',
			'Meu gol de voleio em final de Champions é muito lembrado.',
			'Também tive carreira de destaque como técnico.',
			'Meu sobrenome começa com Z.',
			'Sou o Zinedine Zidane.',
		],
	},
	{
		cardId: 'kylian-mbappe',
		name: ['Mbappé', 'Kylian Mbappé', 'Kylian Mbappe'],
		hints: [
			'Nasci na França.',
			'Atuo como atacante.',
			'Joguei no Monaco e no PSG, depois fui para o Real Madrid.',
			'anytime_guess',
			'Ganhei a Copa do Mundo de 2018.',
			'Marquei gols em final de Copa do Mundo.',
			'Fiquei conhecido por aceleração e arrancada.',
			'Usei por muito tempo a camisa 7 no PSG.',
			'Meu sobrenome tem acento em francês.',
			'Sou o Kylian Mbappé.',
		],
	},
	{
		cardId: 'luka-modric',
		name: ['Modrić', 'Modric', 'Luka Modrić', 'Luka Modric'],
		hints: [
			'Nasci na Croácia.',
			'Atuo como meio-campista.',
			'Tenho longa passagem pelo Real Madrid.',
			'skip_turn',
			'Disputei final de Copa do Mundo com minha seleção.',
			'Ganhei Champions League várias vezes.',
			'Fui eleito melhor do mundo em 2018.',
			'Sou reconhecido por visão de jogo e passes longos.',
			'Meu sobrenome pode ser escrito com ou sem acento.',
			'Sou o Luka Modrić.',
		],
	},
];

async function seedCards() {
	const playersCollection = await getPlayersCollection();

	let inserted = 0;
	let updated = 0;

	for (const card of cards) {
		const result = await playersCollection.updateOne(
			{ cardId: card.cardId },
			{ $set: card },
			{ upsert: true },
		);

		if (result.upsertedCount > 0) {
			inserted++;
		}
		else if (result.matchedCount > 0) {
			updated++;
		}
	}

	console.log(`Cards processados: ${cards.length}`);
	console.log(`Inseridos: ${inserted}`);
	console.log(`Atualizados: ${updated}`);
}

async function main() {
	try {
		await connectDB();
		await seedCards();
	}
	catch (error) {
		console.error('Erro ao inserir cards:', error);
		process.exitCode = 1;
	}
	finally {
		await closeDB();
	}
}

main();
