import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import { logger } from './service_parameters.mjs';


export class EventScanner {
	web3: Web3;

	constructor(web3: Web3) {
		logger.info('Creating a scanner');
		this.web3 = web3;
		logger.info('Scanner created');
	}

	scan(
		target: { address: string; abi: AbiItem[]; },
		fromBlock: number,
		filters: { event: string, callback: (data: object) => Promise<void>; }[],
	) {
		for (const filter of filters) {
			logger.debug('Scanning events');
			const parameters = this.prepareSubscriptionParameters(target.address, target.abi, filter.event, fromBlock);
			this.web3.eth.subscribe('logs', parameters.options, (error, result) => {
				if (error) {
					logger.error(error);
				} else {
					const data = parameters.parsers[result.topics[0]](result.data, result.topics);
					data.blockNumber = result.blockNumber;
					data.transactionHash = result.transactionHash;
					filter.callback(data);
				}
			});
		}
	}

	getEventABI(abi: AbiItem[], eventName: string): AbiItem {
		return abi.find((item: AbiItem) => item.type === 'event' && item.name === eventName);
	}

	prepareSubscriptionParameters(
		address: string,
		abi: AbiItem[],
		event: string,
		fromBlock: number,
	): { options: { address: string; topics: string[]; fromBlock: number; }; parsers: object }
	{
		logger.debug('Preparing subscription parameters');
		const options = {
			address: address,
			topics: [],
			fromBlock: fromBlock,
		};
		const parsers = {};

		const eventABI = this.getEventABI(abi, event);
		if (!eventABI) {
			logger.error('Event ABI not found for: ', address, event);
			return { options, parsers };
		}

		const topic = this.web3.eth.abi.encodeEventSignature(eventABI);
		parsers[topic] = (data: string, topics: string[]) => {
			topics = !eventABI.anonymous ? topics.slice(1) : topics;
			return this.web3.eth.abi.decodeLog([...eventABI.inputs], data, topics);
		};
		options.topics = [topic];
		logger.debug('Subscription parameters are prepared');

		return { options, parsers };
	}
}
