const { soma, lerArquivo } = require('./index.js') // outro tipo de importação
const chalk = require('chalk')

const resultado = soma(1, 3);

console.log(chalk.bgRed("A soma é:"), chalk.blue(resultado));

const caminhoArquivo = process.argv[2];
lerArquivo(caminhoArquivo)
  .then((conteudoDoArquivo) => {
    console.log(chalk.bgBlue(conteudoDoArquivo))
  });

// const inputs = process.argv
// console.log(inputs)