import TgBot from 'node-telegram-bot-api';

import { logger } from './service_parameters.mjs';


export class Bot {
	bot: TgBot | null;
	chatId: string;

	constructor(token: string, chatId: string, allowMessage: boolean) {
		if (allowMessage) {
			this.bot = new TgBot(token, {polling: true});
			this.chatId = chatId;
			this.bot.on('message', (msg: { chat: { id: number; }; }) => {
				logger.info(msg.chat.id);
			});
		} else {
			this.bot = null;
		}
	}

	async sendMessage(message: string) {
		if (!this.bot) {
			const body = {text: message};

			logger.debug('Sending a message');
			try {
				await fetch("https://hooks.slack.com/services/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",{
				method: "POST",
				headers: {
					"Content-Type":"application/json"
				},
				body: JSON.stringify(body)
			})
			logger.debug('Message sent');
			}catch(error) {
				console.log(error);
			}
		} else {
			logger.info('Not sending a message: \'allowMessage\' is false');
			logger.debug('The message: ', message);
		}
	}
}
