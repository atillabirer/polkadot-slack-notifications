import process from 'process';
import Web3 from 'web3';
import { WebsocketProvider } from 'web3-core';

import { Bot } from './bot.mjs';
import { EventScanner } from './event_scanner.mjs';
import { MetricsExporter } from './metrics_exporter.mjs';
import { logger, ServiceParameters } from './service_parameters.mjs';


const EXIT_FAILURE = 0;
const HEARTBEAT_INTERVAL_MS = 20_000;


function heartbeat(provider: WebsocketProvider) {
	const perform = async () => {
		logger.info('Sending a heartbeat');
		await provider.connection.send('heartbeat');
	};
	setInterval(perform, HEARTBEAT_INTERVAL_MS);
}

async function main() {
	const serviceParams = new ServiceParameters();

	const metricsExporter = new MetricsExporter(serviceParams.metrics_port, serviceParams.metrics_prefix);
	metricsExporter.start().catch((err) => logger.error(err));

	const bot = new Bot(serviceParams.tgBotToken, serviceParams.tgChatId, serviceParams.allowMessage);

	const TARGET = { address: serviceParams.nimbusAddress, abi: serviceParams.nimbusAbi };

	const FILTERS = [
		{
			event: 'Deposited',
			callback: async (data: { sender: string; amount: number; transactionHash: any; blockNumber: number; }) => {
				logger.info('Got deposit to nimbus', data);
				const message = '⬆ DEPOSIT\n' +
                    `from: ${data.sender}\n` +
                    `amount: ${data.amount / 10 ** serviceParams.decimals} xc${serviceParams.token}\n` +
                    `trx: ${serviceParams.explorer}${data.transactionHash}`;
				await bot.sendMessage(message);
			},
		},
		{
			event: 'Rewards',
			callback: async (data: { ledger: any; rewards: number; transactionHash: any; blockNumber: number; }) => {
				logger.info('Got rewards to nimbus', data);
				const message = '💲 REWARDS\n' +
                    `ledger: ${data.ledger}\n` +
                    `amount: ${data.rewards / 10 ** serviceParams.decimals} ${serviceParams.token}\n` +
                    `trx: ${serviceParams.explorer}${data.transactionHash}`;
				await bot.sendMessage(message);
			},
		},
		{
			event: 'Losses',
			callback: async (data: { ledger: any; losses: number; transactionHash: any; blockNumber: number; }) => {
				logger.info('Got losses on nimbus', data);
				const message = '❗ LOSSES\n' +
                    `ledger: ${data.ledger}\n` +
                    `amount: ${data.losses / 10 ** serviceParams.decimals} ${serviceParams.token}\n` +
                    `trx: ${serviceParams.explorer}${data.transactionHash}`;
				await bot.sendMessage(message);
			},
		},
		{
			event: 'Redeemed',
			callback: async (data: { receiver: any; amount: number; transactionHash: any; blockNumber: number; }) => {
				logger.info('Got redeem from nimbus', data);
				const message = '⬇ REDEEM\n' +
                    `from: ${data.receiver}\n` +
                    `amount: ${data.amount / 10 ** serviceParams.decimals} n${serviceParams.token}\n` +
                    `trx: ${serviceParams.explorer}${data.transactionHash}`;
				await bot.sendMessage(message);
			},
		},
	];

	const provider = new Web3.providers.WebsocketProvider(serviceParams.wsUrlPara, serviceParams.providerOptions);
	provider.on('connect', () => heartbeat(provider));
	const web3 = new Web3(provider);

	const currentBlock = await web3.eth.getBlockNumber();
	logger.info(`Current block: ${currentBlock}`);
	const fromBlock = currentBlock - serviceParams.offsetFromLastBlock;
	const eventScanner = new EventScanner(web3);
	eventScanner.scan(TARGET, fromBlock, FILTERS);
}

main()
	.catch((exc) => {
		logger.error('An exception occurred: ', exc);
		process.exit(EXIT_FAILURE);
	});
