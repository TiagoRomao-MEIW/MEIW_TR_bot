console.time('tempoDecorrido')
const axios = require('axios');
const { count } = require('console');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const fs = require('fs');

const discordMessages = [];
const promises = [];
let index = 1;
fs.createReadStream('discord_aux.csv')
    .pipe(csv())
    .on('data', (row) => {
        const token = row.token;
        const channelID = row.channelid;
        const equipa = row.equipa
        const url = `https://discord.com/api/v9/channels/${channelID}/messages`;
        let headers = {
            'Authorization': `Bot ${token}`
        };
        let params = {
            'limit': 100
        };
        let lastMessageID = null;
        const getMessages = () => {
            if (lastMessageID) {
                params['before'] = lastMessageID;
            }
            return axios.get(url, {
                headers: headers,
                params: params
            }).then(response => {
                const messages = response.data.map(message => {
                    return {
                        index: index++,
                        server: equipa,
                        channel: message.channel_id,
                        author: message.author.username,
                        content: `${message.content.replace(/\n/g, ' ')}`,
                        timestamp: message.timestamp.split('T')[0]
                    };
                });
                discordMessages.push(...messages);
                if (response.data.length == 100) {
                    lastMessageID = response.data[99].id;
                    return new Promise(resolve => setTimeout(resolve, 1000)).then(getMessages);
                } else {
                    return;
                }
            }).catch(error => {
                console.error(`Erro ao obter mensagens do canal ${channelID}: ${error}`);
                return [];
            });
        }
        promises.push(getMessages());
        console.log(`Mensagens da Equipa ${equipa} e do canal ${channelID} foram extraídas!`)
    })
    .on('end', () => {
        Promise.all(promises).then(() => {
            const csvWriter = createCsvWriter({
                path: 'DiscordMsg.csv',
                header: [
                    { id: 'index', title: 'Index' },
                    { id: 'server', title: 'Servidor' },
                    { id: 'channel', title: 'Canal' },
                    { id: 'author', title: 'Aluno' },
                    { id: 'content', title: 'Mensagem' },
                    { id: 'timestamp', title: 'Data' }
                ]
            });
            csvWriter.writeRecords(discordMessages)
                .then(() => {
                    console.log(`CSV criado com sucesso com ${discordMessages.length} mensagens!`);
                    console.timeEnd('tempoDecorrido')
                })
                .catch(error => {
                    console.error(`Erro ao criar ficheiro CSV: ${error}`);
                    console.timeEnd('tempoDecorrido')
                });
        });
    });