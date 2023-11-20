const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function normalizeURL(url) {
  if (!url.startsWith('http')) {
    return 'http://' + url;
  }
  return url;
}

function validate(link) {
  return new Promise((resolve) => {
    const protocol = link.href.startsWith('https') ? https : http;
    const requestOptions = {
      method: 'HEAD',
    };

    const request = protocol.request(link.href, requestOptions, (res) => {
      const { statusCode } = res;
      const ok = statusCode >= 200 && statusCode < 400 ? 'PASS' : 'ERROR';
      resolve({ link, status: statusCode, ok });
    });

    request.on('error', () => {
      resolve({ link, status: 'FAIL', ok: 'FAIL' });
    });

    request.end();
  });
}

function readFiles(filePath) {
  return new Promise((resolve, reject) => {
    if (path.extname(filePath) !== '.md') {
      reject(new Error('O arquivo ou diretório não é um arquivo .md'));
    } else {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }
  });
}

function mdLinks(filePath, options) {
  return new Promise((resolve, reject) => {
    readFiles(filePath)
      .then((data) => {
        const links = [];
        const regex = /\[([^\]]+)]\((http[s]?:\/\/[^\)]+)\)/g;
        let match;
        while ((match = regex.exec(data)) !== null) {
          const text = match[1];
          const href = match[2];
          links.push({ text, href, file: filePath });
        }

        if (options && options.validate) {
          const linkPromises = links.map(validate);

          Promise.all(linkPromises)
            .then((validatedLinks) => {
              if (options && options.stats) {
                const uniqueLinks = Array.from(new Set(validatedLinks.map((link) => link.href)));
                const stats = {
                  total: validatedLinks.length,
                  unique: uniqueLinks.length,
                  broken: validatedLinks.filter((link) => link.ok === 'FAIL').length,
                };
                resolve(stats);
              } else {
                resolve(validatedLinks);
              }
            })
            .catch((error) => {
              reject(error);
            });
        } else if (options && options.stats) {
          const uniqueLinks = Array.from(new Set(links.map((link) => link.href));
          const stats = {
            total: links.length,
            unique: uniqueLinks.length,
            broken: links.filter((link) => link.ok === 'FAIL').length,
          };
          resolve(stats);
        } else {
          resolve(links)
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Exporta as funções como parte de um módulo
module.exports = {
  mdLinks,
  readFiles,
  validate,
  normalizeURL,
};
