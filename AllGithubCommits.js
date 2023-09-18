const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const githubCommits = [];
const githubPromises = [];

const apiKey = '' //token de conta Github

fs.createReadStream('github_aux.csv')
    .pipe(csv())
    .on('data', (row) => {
        const url = `https://api.github.com/repos/${row.owner}/${row.repo}/commits`;
        const promise = axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })
            .then(response => {
                response.data.forEach(commit => {
                    const OWNER = row.owner
                    const REPO = row.repo
                    const author = commit.author.login;
                    const timestamp = commit.commit.author.date.split('T')[0];
                    githubCommits.push({ OWNER, REPO, author, timestamp });
                });
            })
            .catch(error => {
                console.error(`Erro obter commits de ${row.owner}/${row.repo}: ${error}`);
            });

        githubPromises.push(promise);
    })
    .on('end', () => {
        Promise.all(githubPromises).then(() => {
            const csvWriter = createCsvWriter({
                path: 'GitHub.csv',
                header: [
                    { id: 'OWNER', title: 'Owner' },
                    { id: 'REPO', title: 'Repo' },
                    { id: 'author', title: 'Aluno' },
                    { id: 'timestamp', title: 'Data' }
                ]
            });
            csvWriter.writeRecords(githubCommits)
                .then(() => {
                    console.log(`CSV criado com sucesso com ${githubCommits.length} commits!`)
                })
                .catch(error => {
                    console.error(`Erro ao criar ficheiro CSV: ${error}`);
                });
        });
    }); 