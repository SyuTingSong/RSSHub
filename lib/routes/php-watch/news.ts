import { withBaseUrl } from '@/routes/php-watch/utils';
import { DataItem, Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import { fromURL } from 'cheerio';

export const route: Route = {
    path: '/news',
    example: '/php-watch/news',
    handler,
    maintainers: ['syutingsong'],
    name: 'PHP.Watch News',
};

async function linkToFeed(url: URL): Promise<DataItem> {
    const $ = await fromURL(url);

    return {
        title: $('h1.title').text(),
        link: url.href,
        description: $('section.content').html()?.trim(),
        pubDate: parseDate($('div.tags.tag--release-date>span.tag:last').text()),
        image: $('main section.content img:first-of-type').attr('src') || undefined,
    };
}

async function parseNews(baseUrl: string) {
    const $ = await fromURL(baseUrl);

    return {
        title: 'PHP.Watch News',
        link: 'https://php.watch/news',
        description: 'PHP.Watch News',
        item: await Promise.all(
            $('h2.title>a')
                .toArray()
                .map((el) => $(el).attr('href'))
                .map(withBaseUrl(baseUrl))
                .filter((url) => !!url)
                .map((url) => linkToFeed(url))
        ),
    };
}

async function handler() {
    const baseUrl = 'https://php.watch/news';
    const [p1, p2, p3] = await Promise.all(['', '/2', '/3'].map((path) => `${baseUrl}${path}`).map((url) => parseNews(url)));
    return { ...p1, item: [...(p1.item ?? []), ...(p2.item ?? []), ...(p3.item ?? [])] };
}
