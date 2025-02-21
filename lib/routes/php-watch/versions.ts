import { Data, Route } from '@/types';
import { fromURL } from 'cheerio';
import path from 'node:path';

export const route: Route = {
    path: '/versions',
    example: '/php-watch/versions',
    handler,
    maintainers: ['syutingsong'],
    name: 'PHP Versions',
};

async function handler(): Promise<Data | null> {
    const baseUrl = 'https://php.watch/versions';
    const $ = await fromURL(baseUrl);

    return {
        title: 'PHP Versions',
        link: baseUrl,
        item: await Promise.all(
            $('div.version-item')
                .toArray()
                .map((el) => URL.parse($(el).find('h3.title a').attr('href'), baseUrl)!)
                .map((link) =>
                    fromURL(link).then(($) => ({
                        title: `PHP ${path.basename(link.pathname)}: ${$('.tags.tag--release-status>span.tag:last').text()} [${$('.tags.tag--releases-list>span.tag:last').text() || 'N/A'}] [${$('.tags.tag--release-date>span.tag:last').text()}]`,
                        link: link.href,
                        description: $('main section.content-type--cr-content').html() ?? '',
                    }))
                )
        ),
    };
}
