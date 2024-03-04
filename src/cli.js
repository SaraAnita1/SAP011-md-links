#!/usr/bin/env node
const chalk = require('chalk');
const { mdLinks } = require('./index.js');

// Obtém o caminho do arquivo a partir dos argumentos da linha de comando
const filePath = process.argv[2];

// Configura as opções com base nos argumentos da linha de comando
const options = {
  validate: process.argv.includes('--validate'),
  stats: process.argv.includes('--stats'),
};

// Chama a função mdLinks com o caminho do arquivo e as opções
mdLinks(filePath, options)
  .then((result) => {
    if (options.stats) {
      // Se a opção de estatísticas estiver ativada, exibe as estatísticas
      console.log(chalk.pink(`Total: ${result.total}`));
      console.log(chalk.pink(`Unique: ${result.unique}`));
      if (options.validate && result.broken > 0) {
        // Se a opção de validação estiver ativada e há links quebrados, exibe os links quebrados
        console.log(chalk.red(`Broken: ${result.broken}`));
      }
    } else {
      // Se a opção de estatísticas não estiver ativada, exibe os links encontrados
      result.forEach((link) => {
        let output = `${chalk.blue(link.file)} ${chalk.underline(link.href)} ${chalk.blue(link.text)}`;
        if (options.validate) {
          if (link.ok === 'PASS') {
            // Se a opção de validação estiver ativada e o link está OK, exibe em verde
            output += ` ${chalk.bgGreen(link.ok)}`;
          } else {
            // Se o link não estiver OK, exibe em vermelho com o status do link
            output += ` ${chalk.bgRed(link.status)}`;
          }
        }
        console.log(output);
      });
    }
  })
  .catch((error) => {
    // Em caso de erro, exibe a mensagem de erro em vermelho
    console.error(chalk.red(error.message));
  });
