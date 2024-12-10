const fs = require('fs').promises;
const path = require('path');
const baseDir = path.join(__dirname, 'arquivos');

async function readData(fileName) {
    try {
        const filePath = path.join(baseDir, fileName);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Arquivo ${fileName} não encontrado`);
            return [];
        } else if (error.name === 'SyntaxError') {
            console.error(`Arquivo ${fileName} contém JSON inválido`);
            return [];
        } else {
            console.error(`Erro ao ler o arquivo ${fileName}:`, error.message);
            throw error;
        }
    }
}

async function writeData(fileName, data) {
    try {
        const filePath = path.join(baseDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`Erro ao escrever no arquivo ${fileName}:`, error.message);
    }
}

module.exports = {
    readData,
    writeData
};