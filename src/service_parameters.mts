import assert from 'assert';
import fs from 'fs';
import log4js from 'log4js';
import web3Utils from 'web3-utils';


const PROVIDER_DELAY_MS = 5_000;
const PROVIDER_MAX_ATTEMPTS = 5;
const DEFAULT_METRICS_PORT = 8_000;
const DEFAULT_METRICS_PREFIX = 'trx_monitor_';

const DEFAULT_DECIMALS = 10;
const DEFAULT_LOG_LEVEL = 'debug';
const DEFAULT_NIMBUS_ABI_PATH = './assets/Nimbus.json';

const LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'];



export const logger = log4js.getLogger();


export class ServiceParameters {
	allowMessage: boolean;
	decimals: number;
	explorer: string;
	metrics_port: number;
	metrics_prefix: string;
	nimbusAddress: string;
	nimbusAbi: web3Utils.AbiItem[];
	offsetFromLastBlock: number;
	providerOptions: { reconnect: { auto: boolean; delay: number; maxAttempts: number; onTimeout: boolean; }; };
	tgBotToken: string;
	tgChatId: string;
	token: string;
	wsUrlPara: string;

	constructor() {
		logger.info('Checking configuration parameters');

		logger.info('[ENV] GET \'LOG_LEVEL\'');
		const level = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;
		assert.ok(this._isCorrectLogLevel(level), `Valid log levels: ${LOG_LEVELS}`);
		log4js.configure({
			appenders: {
				out: {
					type: 'stdout',
					layout: {
						type: 'pattern',
						pattern: '%[[%d] [%p] [%c]%] [%f{1}:%l:%o] %m'
					}
				}
			},
			categories: {
				default: { appenders: ['out'], level: level, enableCallStack: true },
			},
		});
		logger.info(`[ENV] 'LOG_LEVEL': ${logger.level}`);

		logger.info('[ENV] GET \'NIMBUS_ADDRESS\'');
		this.nimbusAddress = process.env.NIMBUS_ADDRESS;
		assert.ok(this.nimbusAddress, 'Not provided');
		this.nimbusAddress = web3Utils.toChecksumAddress(this.nimbusAddress);
		logger.info('[ENV] \'NIMBUS_ADDRESS\': ', this.nimbusAddress);

		logger.info('[ENV] GET \'NIMBUS_ABI_PATH\'');
		const nimbusAbiPath = process.env.NIMBUS_ABI_PATH || DEFAULT_NIMBUS_ABI_PATH;
		logger.info('[ENV] \'NIMBUS_ABI_PATH\': ', nimbusAbiPath);
		logger.info('Parsing Nimbus ABI...');
		this.nimbusAbi = JSON.parse(String(fs.readFileSync(nimbusAbiPath)));
		logger.info('Nimbus ABI: successfully parsed');

		logger.info('[ENV] GET \'EXPLORER\'');
		this.explorer = process.env.EXPLORER;
		assert.ok(this.explorer, 'Not provided');
		logger.info('[ENV] \'EXPLORER\': ', this.explorer);

		logger.info('[ENV] GET \'WS_URL_PARA\'');
		this.wsUrlPara = process.env.WS_URL_PARA;
		assert.ok(this.wsUrlPara, 'Not provided');
		logger.info(`[ENV] 'WS_URL_PARA': successfully got, contains ${this.wsUrlPara.length} symbols`);

		logger.info('[ENV] Get \'DECIMALS\'');
		this.decimals = Number(process.env.DECIMALS) || DEFAULT_DECIMALS;
		logger.info('[ENV] \'DECIMALS\': ', this.decimals);

		logger.info('[ENV] Get \'METRICS_PORT\'');
		this.metrics_port = Number(process.env.METRICS_PORT) || DEFAULT_METRICS_PORT;
		logger.info('[ENV] \'METRICS_PORT\': ', this.metrics_port);

		logger.info('[ENV] Get \'PROMETHEUS_METRICS_PREFIX\'');
		this.metrics_prefix = process.env.PROMETHEUS_METRICS_PREFIX || DEFAULT_METRICS_PREFIX;
		logger.info('[ENV] \'PROMETHEUS_METRICS_PREFIX\': ', this.metrics_prefix);

		logger.info('[ENV] Get \'OFFSET_FROM_LAST_BLOCK\'');
		const offsetFromLastBlock = process.env.OFFSET_FROM_LAST_BLOCK;
		assert.ok(offsetFromLastBlock, 'Not provided');
		this.offsetFromLastBlock = Number(offsetFromLastBlock);
		assert.ok(this.offsetFromLastBlock >= 0, 'Must be a non-negative integer');
		logger.info('[ENV] \'OFFSET_FROM_LAST_BLOCK\': ', this.offsetFromLastBlock);

		logger.info('[ENV] Get \'ALLOW_MESSAGE\'');
		this.allowMessage = !!process.env.ALLOW_MESSAGE;
		logger.info('[ENV] \'ALLOW_MESSAGE\': ', this.allowMessage);

		logger.info('[ENV] Get \'TG_BOT_TOKEN\'');
		this.tgBotToken = process.env.TG_BOT_TOKEN;
		if (this.allowMessage) {
			assert.ok(this.tgBotToken, 'Not provided');
			logger.info('[ENV] \'TG_BOT_TOKEN\': successfully got');
		} else {
			logger.info('[ENV] \'TG_BOT_TOKEN\': not provided');
		}

		logger.info('[ENV] Get \'TG_CHAT_ID\'');
		this.tgChatId = process.env.TG_CHAT_ID;
		if (this.allowMessage) {
			assert.ok(this.tgChatId, 'Not provided');
			logger.info('[ENV] \'TG_CHAT_ID\': successfully got');
		} else {
			logger.info('[ENV] \'TG_CHAT_ID\': not provided');
		}

		logger.info('[ENV] GET \'TOKEN\'');
		this.token = process.env.TOKEN;
		if (this.allowMessage) {
			assert.ok(this.token, 'Not provided');
		} else {
			logger.info('[ENV] \'TOKEN\': not provided');
		}

		this.providerOptions = {
			reconnect: {
				auto: true,
				delay: PROVIDER_DELAY_MS,
				maxAttempts: PROVIDER_MAX_ATTEMPTS,
				onTimeout: false,
			},
		};

		logger.info('Configuration parameters successfully checked');
	}

	_isCorrectLogLevel(logLevel: string): boolean {
		for (const level of LOG_LEVELS) {
			if (level.toLowerCase() == logLevel.toLowerCase()) {
				return true;
			}
		}

		return false;
	}
}
