import { withBaseUrl } from '@/routes/php-watch/utils';
import { Data, DataItem, Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import { fromURL } from 'cheerio';
import { inspect } from 'node:util';

inspect.defaultOptions.depth = 3;
export const route: Route = {
    path: '/articles',
    example: '/php-watch/articles',
    handler,
    maintainers: ['syutingsong'],
    name: 'Articles',
};

async function linkToFeed(url: URL): Promise<DataItem> {
    const $ = await fromURL(url);

    return {
        title: $('main article h1.title').text(),
        link: url.href,
        description: $('main section.content').html()?.trim(),
        image: $('main section.content img:first-of-type').attr('src'),
        pubDate: parseDate($('main article div.tagline span.tag').last().text()),
    };
}

async function handler(): Promise<Data | null> {
    const [p1, p2, p3] = await Promise.all(['', '/2', '/3'].map((sub) => parseArticles(`https://php.watch/articles${sub}`)));

    return {
        ...p1,
        item: [...(p1.item ?? []), ...(p2.item ?? []), ...(p3.item ?? [])],
    };
}

async function parseArticles(baseUrl: string): Promise<Data> {
    const $ = await fromURL(baseUrl);

    return {
        title: $('title').text(),
        link: baseUrl,
        image: $('link[rel="icon"]').attr('href'),
        author: $('meta[name="author"]').attr('content'),
        description: $('meta[name="description"]').attr('content') ?? '',
        item: await Promise.all(
            $('h2.title')
                .toArray()
                .map((el) => withBaseUrl(baseUrl)($(el).children('a').attr('href')))
                .filter((url) => !!url)
                .map((url) => linkToFeed(url))
        ),
    };
}
