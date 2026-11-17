import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const source = path.resolve(process.argv[2] || '../recovered-blogs/Aaron1992.github.io');
const out = path.resolve('src/content/posts');
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.use(gfm);
td.addRule('legacyHeadings', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement(content, node) {
    const level = Math.min(Number(node.nodeName[1]) + 1, 6);
    const anchor = node.getAttribute('id');
    return `\n\n${anchor ? `<a id="${anchor.replaceAll('"', '&quot;')}"></a>\n\n` : ''}${'#'.repeat(level)} ${content}\n\n`;
  },
});
td.addRule('codeFences', {
  filter: node => node.nodeName === 'PRE',
  replacement(_content, node) {
    const code = node.querySelector('code');
    const lang = code?.getAttribute('class')?.match(/language-([\w+-]+)/)?.[1] || '';
    const text = (code || node).textContent.replace(/\n$/, '');
    const fence = '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
    return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`;
  },
});
const records = [];
const missing = [];
const externalImages = new Set();
const assets = new Set();
const tagsBySlug = {
  'Arm平台的调用栈回溯': ['C/C++', '调试'],
  '动态链接库函数内的静态变量-奇妙的UNIQUE-Bind': ['C/C++', 'Linux'],
  'core-dump文件分析和调试': ['调试', 'Linux'],
  'bbr': ['Linux', '网络'], 'fail2ban': ['Linux', '安全'],
  'create-git-service-with-gog': ['Git', '部署'],
  'gogs和git-hook实现hex博客一键式部署': ['Git', '部署'],
  'appleid切换美区': ['工具'], 'hashcat破解office密码': ['安全', '工具'],
  '破解py2exe打包的程序': ['Python', '逆向分析'],
  'meteorshi-yong-xian-you-de-mongodbshu-ju-ku': ['Web', '数据库'],
  'zi-mu-zhuan-huan-da-xiao-xie': ['编程'],
  'shi-yong-las-vegassui-ji-suan-fa-qiu-nhuang-hou-wen-ti-de-jie': ['算法'],
  'dian-xin-fu-wu-shang-ping-bi-digitaloceanxin-jia-po-ip': ['网络'],
  'ubuntu-an-zhuang-ssh-serverbing-qie-yun-xu-rootdeng-lu': ['Linux', 'SSH'],
  'da-hua-tong-bu-yi-bu-zu-sai-fei-zu-sai': ['编程', '网络'],
  'ghost-blogan-zhuang-xiang-xi-guo-cheng': ['部署', 'Web'],
  'fen-xi-500pxde-apibing-qie-zhi-zuo-ge-pa-chong': ['Python', '爬虫'],
  'vim-tutorial': ['Vim'], 'vim-xue-xi-bi-ji-1': ['Vim'],
  'vim-xue-xi-bi-ji-shi-yong-biao-qian-lan': ['Vim'], 'hello-world': ['随笔'],
};
fs.mkdirSync(out, { recursive: true });
for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const htmlFile = path.join(source, entry.name, 'index.html');
  if (!fs.existsSync(htmlFile)) continue;
  const $ = load(fs.readFileSync(htmlFile, 'utf8'));
  const body = $('[itemprop="articleBody"]');
  if (!body.length) continue;
  const title = $('.post-title').first().text().trim() || $('title').text().split('|')[0].trim();
  const date = $('time[itemprop*="datePublished"]').attr('datetime')?.slice(0, 10);
  if (!date) throw new Error(`Missing date: ${entry.name}`);
  const updated = $('time[itemprop="dateModified"]').attr('datetime')?.slice(0, 10);
  body.find('.headerlink, script, style').remove();
  body.find('figure.highlight').each((_, el) => {
    const pre = $(el).find('td.code pre');
    pre.find('br').replaceWith('\n');
    const language = ($(el).attr('class') || '').split(' ').find(c => c !== 'highlight') || '';
    const replacement = $('<pre></pre>');
    replacement.append($('<code></code>').addClass(`language-${language}`).text(pre.text()));
    $(el).replaceWith(replacement);
  });
  body.find('[href], [src]').each((_, el) => {
    for (const attr of ['href', 'src']) {
      let value = $(el).attr(attr);
      if (!value) continue;
      try {
        const url = new URL(value, 'https://zmyth.me');
        if (['zmyth.me', 'www.zmyth.me', 'aaron1992.github.io'].includes(url.hostname)) {
          value = url.pathname + url.search + url.hash;
          $(el).attr(attr, value);
        }
      } catch {}
      if (attr === 'src' && /^https?:\/\//.test(value)) externalImages.add(value);
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      const clean = decodeURIComponent(value.split(/[?#]/)[0]);
      const local = path.join(source, clean);
      if (fs.existsSync(local) && fs.statSync(local).isFile()) {
        if (fs.statSync(local).st_size > 25 * 1024 * 1024) { missing.push({ article: entry.name, asset: value, reason: 'exceeds 25 MiB' }); continue; }
        const dest = path.join('public', clean);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(local, dest); assets.add(clean);
      } else if (attr === 'src') missing.push({ article: entry.name, asset: value, reason: 'not in recovered files' });
    }
  });
  const description = body.find('p').map((_, el) => $(el).text()).get().join(' ').replace(/\s+/g, ' ').trim().slice(0, 150);
  const data = { title, date, ...(updated ? { updated } : {}), description: description || title, slug: entry.name, tags: tagsBySlug[entry.name] || ['技术'] };
  const frontmatter = Object.entries(data).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
  fs.writeFileSync(path.join(out, `${entry.name}.md`), `---\n${frontmatter}\n---\n\n${td.turndown(body.html())}\n`);
  records.push({ ...data, source: path.relative(source, htmlFile), codeBlocks: body.find('pre').length, images: body.find('img').length });
}
// Preserve the dated article URLs present in the old build, including Hello World aliases.
const redirects = [];
for (const year of ['2014', '2015', '2016', '2018']) {
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === 'index.html') {
        const slug = path.basename(path.dirname(p));
        if (records.some(r => r.slug === slug)) redirects.push(`/${path.relative(source, path.dirname(p))}/ /${slug}/ 301`);
      }
    }
  };
  walk(path.join(source, year));
}
redirects.push('/categories/ /tags/ 301', '/Friends/ /about/ 301', '/page/2/ /archives/ 301', '/page/3/ /archives/ 301');
fs.writeFileSync('public/_redirects', redirects.join('\n') + '\n');
fs.writeFileSync('docs/migration.json', JSON.stringify({ articles: records.sort((a,b) => b.date.localeCompare(a.date)), assets: [...assets], missing, externalImages: [...externalImages], redirects }, null, 2));
console.log(`Migrated ${records.length} articles, ${assets.size} assets, ${redirects.length} redirects. Missing assets: ${missing.length}; external images: ${externalImages.size}.`);
