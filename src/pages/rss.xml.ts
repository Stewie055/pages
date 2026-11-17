import rss from '@astrojs/rss';
import { getPosts, postUrl } from '../lib/posts';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({ title: '二哈博客', description: '编程、系统、工具与思考。', site: context.site!, items: posts.map(p => ({ title: p.data.title, pubDate: p.data.date, description: p.data.description, link: postUrl(p.data.slug), categories: p.data.tags })), customData: '<language>zh-cn</language>' });
}
