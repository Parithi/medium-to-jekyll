#!/usr/bin/env node
// Requires Node 12+

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const TurndownService = require('turndown')
const { gfm } = require('turndown-plugin-gfm')

const MetadataExtractor = require('./metadata-extractor');
const MediumHelpers = require('./medium-helpers');

const inputFilename = process.argv[2];
const inputDir = path.dirname(inputFilename);
const basename = path.basename(inputFilename, '.html');

const html = fs.readFileSync(inputFilename, 'utf-8');

const metadata = new MetadataExtractor(html);

if (metadata.looksLikeComment) {
  console.log('[Skip] Looks like a comment:', inputFilename);
  process.exit(0);
}

const suggestedOutputFileBasename = MediumHelpers.suggestOutputFilename(basename, metadata);

if (!suggestedOutputFileBasename) {
  throw `Unable to identify file name. Not a correct format? '${basename}'`;
}

const outputFilename = path.join(inputDir, suggestedOutputFileBasename + '.md');

const cleanedUpHTML = MediumHelpers.cleanupMediumHTML(html);

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
})

turndownService.use(gfm);

const markdown = turndownService.turndown(cleanedUpHTML);
const frontMatter = yaml.safeDump(metadata.toYAMLFrontMatter());

const content = [
  '---',
  frontMatter,
  '---',
  markdown
].join("\n");

fs.writeFileSync(outputFilename, content);

console.log('[Done] Exported to', outputFilename);
