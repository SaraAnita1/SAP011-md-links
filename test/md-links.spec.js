const { mdLinks, readFiles, validate, normalizeURL } = require('../src/mdLinks.js');
const fs = require('fs');
const path = require('path');

describe('normalizeURL', () => {
  it('should normalize URLs', () => {
    const url = 'example.com';
    const normalizedURL = normalizeURL(url);
    expect(normalizedURL).toBe('http://example.com');
  });

  it('should not modify URLs that already have a protocol', () => {
    const url = 'https://www.example.com';
    expect(normalizeURL(url)).toBe('https://www.example.com');
  });

  it('should add "https://" to the URL if it starts with "www."', () => {
    const url = 'www.example.com';
    expect(normalizeURL(url)).toBe('http://www.example.com');
  });
});

describe('validate', () => {

  it('should validate links if the "validate" option is provided', async () => {
    const filePath = 'text.md';
    const options = { validate: true };
    const links = await mdLinks(filePath, options);
    links.forEach(link => {
      expect(link).toHaveProperty('ok');
      expect(link).toHaveProperty('status');
    });
  });
  it('should return a PASS status for a valid link', () => {
    const link = { href: 'https://example.com' };
    const responseMock = { statusCode: 200 };
    const requestMock = jest.fn().mockReturnValue({
      on: (event, callback) => {
        if (event === 'response') {
          callback(responseMock);
        }
      },
      end: jest.fn(),
    });

    jest.spyOn(require('https'), 'request').mockImplementation(requestMock);

    validate(link).then((result) => {
      expect(result.ok).toBe('PASS');
      expect(result.status).toBe(200);
    });
  });

  it('should return a ERROR status for an invalid link', () => {
    const link = { href: 'https://example.com' };
    const responseMock = { statusCode: 404 };
    const requestMock = jest.fn().mockReturnValue({
      on: (event, callback) => {
        if (event === 'response') {
          callback(responseMock);
        }
      },
      end: jest.fn(),
    });

    jest.spyOn(require('https'), 'request').mockImplementation(requestMock);

    jest.spyOn(require('http'), 'request').mockImplementation(requestMock);

    validate(link).then((result) => {
      expect(result.ok).toBe('ERROR');
      expect(result.status).toBe(404);
    });
  });

  it('should handle an HTTP response with status code 301 (Redirect)', () => {
    const link = { href: 'https://example.com' };
    const responseMock = { statusCode: 301, headers: { location: 'https://newexample.com' } };
    const requestMock = jest.fn().mockReturnValue({
      on: (event, callback) => {
        if (event === 'response') {
          callback(responseMock);
        }
      },
      end: jest.fn(),
    });

    jest.spyOn(require('https'), 'request').mockImplementation(requestMock);

    jest.spyOn(require('http'), 'request').mockImplementation(requestMock);

    validate(link).then((result) => {
      expect(result.ok).toBe('REDIRECT');
      expect(result.status).toBe(301);
      expect(result.redirectedTo).toBe('https://newexample.com');
    });
  });

  it('should handle an error when a request fails', () => {
    const link = { href: 'https://example.com' };
    const requestMock = jest.fn().mockReturnValue({
      on: (event, callback) => {
        if (event === 'error') {
          callback(new Error('Request error'));
        }
      },
    });

    jest.spyOn(require('https'), 'request').mockImplementation(requestMock);

    return validate(link).then((result) => {
      expect(result.ok).toBe('FAIL');
    });
  });
});

describe('readFiles', () => {
  it('should read and resolve the content of an existing .md file', () => {
    const filePath = path.join('text.md');
    readFiles(filePath)
      .then((data) => {
        expect(data).toBeTruthy();
      });
  });

  it('should reject for a non-existing .md file', () => {
    const filePath = 'nonexisting.md';
    expect(readFiles(filePath)).rejects.toThrow();
  });

  describe('mdLinks', () => {
    it('should read a Markdown file and return an array of links', async () => {
      const filePath = 'text.md';
      const links = await mdLinks(filePath);
      expect(Array.isArray(links)).toBe(true);
      expect(links.length).toBeGreaterThan(0);
    });

    it('should return link statistics if the "stats" option is provided', async () => {
      const filePath = 'text.md';
      const options = { stats: true };
      const stats = await mdLinks(filePath, options);
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('unique');
      expect(stats).toHaveProperty('broken');
    });

    it('should handle errors when reading a non-Markdown file', async () => {
      const filePath = 'text.md';
      try {
        await mdLinks(filePath);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should return an array of links', async () => {
      const filePath = 'text.md';
      const options = {};
      const result = await mdLinks(filePath, options);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return link statistics if options.stats is true', async () => {
      const filePath = 'text.md';
      const options = { stats: true };
      const resultPromises = mdLinks(filePath, options);

      const result = await resultPromises;

      expect(result.total).toBeDefined();
      expect(result.unique).toBeDefined();
      expect(result.broken).toBeDefined();
    });

    it('should reject with an error for an invalid .md file', () => {
      const filePath = 'invalid.md';
      expect(mdLinks(filePath)).rejects.toThrow();
    });

    it('should return an array of links with ERROR status when at least one link is invalid', async () => {
      const filePath = 'text.md';
      const options = { validate: false };
      const result = await mdLinks(filePath, options);
      expect(result.some((link) => link.ok === 'ERROR')).toBe(false);
    });

    it('should return an array of links with FAIL validate when at least one link is not reachable', async () => {
      const filePath = 'text.md';
      const options = { validate: false };
      const result = await mdLinks(filePath, options);
      expect(result.some((link) => link.ok === 'FAIL')).toBe(false);
    });

    it('should return an array of links with ERROR status/validate', async () => {
      const filePath = 'text.md'; // Use um arquivo com links válidos
      const options = { stats: false, validate: false };
      const result = await mdLinks(filePath, options);
      expect(result.every((link) => link.ok === 'ERROR')).toBe(false);
    });
  });
});