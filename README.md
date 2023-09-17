# nimbus-trx-monitor
The service that monitors events (Deposited, Rewards, Losses and Redeemed) in the Nimbus protocol and sends messages in Telegram.

Prometheus metrics are available at `0.0.0.0:{METRICS_PORT}/metrics`.


## Setup
```shell
npm i
```


## Run
The service receives its configuration parameters from environment variables. Export required parameters from the list below and start the service:
```shell
bash run.sh
```


## List of events from the Nimbus contract that are used by the service
Events:

1) `Deposited`
2) `Losses`
3) `Redeemed`
4) `Rewards`


## Configuration parameters
#### Required
* `EXPLORER` - The link to the explorer.
* `OFFSET_FROM_LAST_BLOCK` - The `fromBlock` that will be set for the event emitter: `latest_block_number - OFFSET_FROM_LAST_BLOCK`.
* `NIMBUS_ADDRESS` - The address of the Nimbus contract. Example: `0x000000000000000000000000000000000000dEaD`.
* `WS_URL_PARA` - The Websocket URL of the parachain node. Example: `ws://localhost:10059/`.

#### Optional
* `DECIMALS` - The default value is `10`.
* `LOG_LEVEL` - The logging level of the logging module: `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`. The default level is `INFO`.
* `METRICS_PORT` - The port at which the Prometheus client is started. The default value is `8000`.
* `METRICS_PREFIX` - Prometheus metrics prefix. The default value is `trx_monitor_`.
* `NIMBUS_ABI_PATH` - The path to the Nimbus ABI. The default value is `./assets/Nimbus.json`.

#### Telegram Bot
* `ALLOW_MESSAGE` - If the value is `true`, the service tries to send messages in Telegram.

If the `ALLOW_MESSAGE` is set to `true` and any of the following values are not provided, the service doesn't start:
* `CHAIN` - The name of a chain. It is used in Telegram messages.
* `TG_BOT_TOKEN` - Telegram bot token.
* `TG_CHAT_ID` - Telegram chat id.
