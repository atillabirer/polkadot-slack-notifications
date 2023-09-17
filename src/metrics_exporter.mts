import express from 'express';
import PromClient from 'prom-client';


export class MetricsExporter {
	port: number;
	server: { get: (arg0: string, arg1: (req: any, res: any) => Promise<void>) => void; listen: (arg0: number) => void; };

	constructor(port: number, prefix: string) {
		PromClient.collectDefaultMetrics({ prefix: prefix });
		this.port = port;

		this.server = express();
		this.server.get('/metrics', async (req, res) => {
			try {
				res.set('Content-Type', PromClient.register.contentType);
				res.end(await PromClient.register.metrics());
			} catch (err) {
				res.status(500).end(err);
			}
		});
	}

	async start(): Promise<void> {
		this.server.listen(this.port);
	}
}
