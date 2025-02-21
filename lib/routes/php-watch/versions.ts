import { Data, Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import { fromURL } from 'cheerio';
import path from 'node:path';
import { z } from 'zod';
import { withBaseUrl } from './utils';
import { Context } from 'hono';

export const route: Route = {
    path: '/versions/:ver?',
    example: '/php-watch/versions',
    handler,
    maintainers: ['syutingsong'],
    name: 'PHP Versions',
    parameters: {
        ver: 'Specific PHP version for detail releases',
    },
};

async function fetchReleases(ver: string): Promise<Data> {
    const baseUrl = `https://php.watch/versions/${ver}/releases`;

    const $ = await fromURL(baseUrl);

    return {
        title: `PHP ${ver} Releases`,
        link: baseUrl,
        description: $('main section.container:not(.content)').text(),
        item: await Promise.all(
            $('section.release-timeline .timeline-item')
                .toArray()
                .map((el) => withBaseUrl(baseUrl)($(el).find('.timeline-inner>a:first').attr('href')))
                .filter((url) => !!url)
                .map(async (url) => {
                    const $ = await fromURL(url);
                    return {
                        title: $('h1').text().split(':')[0],
                        link: url.href,
                        description: $('article').html() || undefined,
                        pubDate: parseDate($('dt:contains("Release Date")+dd>time').attr('datetime')),
                    };
                })
        ),
    };
}

async function handler(ctx: Context): Promise<Data | null> {
    const ver = z
        .string()
        .regex(/^\d+\.\d+$/)
        .optional()
        .parse(ctx.req.param('ver'));

    if (ver !== undefined) {
        return fetchReleases(ver);
    }

    const baseUrl = 'https://php.watch/versions';
    const $ = await fromURL(baseUrl);

    return {
        title: 'PHP Versions',
        link: baseUrl,
        item: await Promise.all(
            $('div.version-item')
                .toArray()
                .map((el) => withBaseUrl(baseUrl)($(el).find('h3.title a').attr('href')))
                .filter((url) => !!url)
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
