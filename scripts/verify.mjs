import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const report = JSON.parse(fs.readFileSync('docs/migration.json', 'utf8'));
const source = path.resolve('../recovered-blogs/Aaron1992.github.io');
const dist = path.resolve('dist');
const failures = [];
let codeBlocks = 0, images = 0, links = 0;
assert.equal(report.articles.length, 22, 'Expected 22 migrated articles');
const resolveFile = pathname => {
  const filename = path.join(dist, decodeURIComponent(pathname));
  if (fs.existsSync(filename) && fs.statSync(filename).isFile()) return filename;
  if (fs.existsSync(path.join(filename, 'index.html'))) return path.join(filename, 'index.html');
  return null;
};
for (const article of report.articles) {
  const $ = load(fs.readFileSync(path.join(dist, article.slug, 'index.html'), 'utf8'));
  const old = load(fs.readFileSync(path.join(source, article.source), 'utf8'));
  assert.equal($('h1').first().text(), article.title);
  const oldCodes = [];
  old('[itemprop="articleBody"] pre').each((_, el) => {
    if (old(el).closest('.gutter').length) return;
    old(el).find('br').replaceWith('\n');
    oldCodes.push(old(el).text().replace(/\r\n/g, '\n').trimEnd());
  });
  const newCodes = $('.prose pre').map((_, el) => $(el).text().replace(/\r\n/g, '\n').trimEnd()).get();
  assert.deepEqual(newCodes, oldCodes, `Code blocks changed: ${article.slug}`);
  assert.equal($('.prose img').length, article.images, `Images changed: ${article.slug}`);
  codeBlocks += newCodes.length; images += article.images;
}
for (const file of fs.readdirSync(dist, { recursive: true }).filter(f => f.endsWith('.html'))) {
  const full = path.join(dist, file);
  const $ = load(fs.readFileSync(full, 'utf8'));
  const ids = new Set();
  $('[id]').each((_, el) => { const id = $(el).attr('id'); if (ids.has(id)) failures.push(`${file}: duplicate id ${id}`); ids.add(id); });
  $('a[href], img[src], script[src], link[href]').each((_, el) => {
    const value = $(el).attr('href') || $(el).attr('src');
    if (!value || !/^(\/|#)/.test(value) || value.startsWith('//')) return;
    links++;
    const currentPath = '/' + file.replace(/index.html$/, '');
    const url = new URL(value, 'https://erossr.com' + currentPath);
    const target = resolveFile(url.pathname);
    if (!target) {
      const redirected = report.redirects.some(line => line.split(' ')[0] === decodeURIComponent(url.pathname));
      if (!redirected) failures.push(`${file}: missing ${value}`);
    } else if (url.hash && target.endsWith('.html')) {
      const other = target === full ? $ : load(fs.readFileSync(target, 'utf8'));
      const id = decodeURIComponent(url.hash.slice(1));
      if (!other('[id]').toArray().some(el => other(el).attr('id') === id)) failures.push(`${file}: missing anchor ${value}`);
    }
  });
}
for (const line of report.redirects) assert.ok(resolveFile(line.split(' ')[1]), `Missing redirect target: ${line}`);
assert.ok(fs.existsSync(path.join(dist, 'pagefind/pagefind.js')));
assert.equal((fs.readFileSync(path.join(dist, 'rss.xml'), 'utf8').match(/<item>/g) || []).length, 22);
assert.deepEqual(failures, [], 'Broken links or duplicate anchors');
console.log(`Verified 22 articles, ${codeBlocks} unchanged code blocks, ${images} images, ${links} links, ${report.redirects.length} redirects, RSS and search assets.`);
