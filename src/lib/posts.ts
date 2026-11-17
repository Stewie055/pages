import { getCollection } from 'astro:content';

export async function getPosts() {
  return (await getCollection('posts')).filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export const postUrl = (slug: string) => `/${encodeURIComponent(slug)}/`;
export const tagSlug = (tag: string) => tag === 'C/C++' ? 'cpp' : tag;
export const tagUrl = (tag: string) => `/tags/${encodeURIComponent(tagSlug(tag))}/`;
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
