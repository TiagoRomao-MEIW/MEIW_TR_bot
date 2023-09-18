
console.time('tempoDecorrido')
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const winston = require('winston');
winston.level = 'warn';

// análise de sentimento
const natural = require('natural');
const { isNull } = require('util');
var tokenizer = new natural.AggressiveTokenizerPt();
var stemmer = natural.PorterStemmerPt.stem
var Analyzer = require('natural').SentimentAnalyzer;
var analyzer = new Analyzer("Portuguese", natural.PorterStemmerPt, "afinn");

const filePath = 'DiscordMsg.csv';
const columnToAnalyze = 'Mensagem';
const outputFilePath = 'Discord.csv';

var ind = 1

// análise da complexidade semântica
function calcularComplexidadeSemantica(frase) {
    const corpusTexto = fs.readFileSync('corpus.txt', 'utf-8');

    const corpusLinhas = corpusTexto.trim().split('\n');
    const corpus = {};
    corpusLinhas.forEach(linha => {
        const [frequencia, palavra] = linha.split('\t');
        corpus[palavra] = Number(frequencia);
    });

    const palavras = frase.toLowerCase().match(/\b\S+\b/g);

    const frequencia = {};
    if (palavras === null) {
        const complexidadeSemantica = 0
        return complexidadeSemantica
    }
    else {
        palavras.forEach(palavra => {
            if (palavra in frequencia) {
                frequencia[palavra]++;
            } else {
                frequencia[palavra] = 1;
            }
        });

    }
    const tfidf = {};
    const totalPalavras = palavras.length;
    for (const palavra in frequencia) {
        const tf = frequencia[palavra] / totalPalavras;
        const idf = Math.log10(Object.keys(corpus).length / (corpus[palavra] || 1));
        tfidf[palavra] = tf * idf;
    }

    const mediaTfidf = Object.values(tfidf).reduce((a, b) => a + b) / Object.keys(tfidf).length;
    const maxTfidf = Math.max(...Object.values(tfidf));
    const complexidadeSemantica = (1 - Math.max(Math.min(mediaTfidf / maxTfidf, 1), 0));


    return complexidadeSemantica;
}

const rows = [];

// criar ficheiros com os indicadores
fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
        const text = row[columnToAnalyze];
        var words = tokenizer.tokenize(text);
        var stemmedWords = words.map(word => stemmer(word));
        var Sentimento = analyzer.getSentiment(stemmedWords)

        const Complexidade = calcularComplexidadeSemantica(text)
        console.log(ind++, Complexidade)

        if (Sentimento > 0) {
            Sentimento = 'Positivo'
            rows.push({ ...row, Complexidade, Sentimento });
        } else if (Sentimento < 0) {
            Sentimento = 'Negativo'
            rows.push({ ...row, Complexidade, Sentimento });
        } else if (Sentimento = 0) {
            Sentimento = 'Neutro'
        } else {
            Sentimento = 'Neutro'
            rows.push({ ...row, Complexidade, Sentimento });
        }
    })
    .on('end', () => {
        const csvWriter = createCsvWriter({
            path: outputFilePath,
            header: [
                { id: 'Aluno', title: 'Aluno' },
                { id: 'Mensagem', title: 'Mensagem' },
                { id: 'Data', title: 'Data' },
                { id: 'Complexidade', title: 'Complexidade' },
                { id: 'Sentimento', title: 'Sentimento' }
            ]
        });
        csvWriter.writeRecords(rows)
            .then(() => {
                console.log('The CSV file was updated successfully!');
                console.timeEnd('tempoDecorrido')
            })
            .catch((error) => {
                console.error(error);
                console.timeEnd('tempoDecorrido')
            });
    });
