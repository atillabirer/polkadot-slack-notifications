FROM node:19

WORKDIR /trx-monitor
COPY . .

RUN npm install

EXPOSE 8000

CMD [ "bash", "run.sh" ]
