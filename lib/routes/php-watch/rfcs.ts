import { ucFirst, withBaseUrl } from '@/routes/php-watch/utils';
import { Data, DataItem, Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import { fromURL } from 'cheerio';
import { Context } from 'hono';
import { z } from 'zod';

export const route: Route = {
    path: '/rfcs/:status',
    example: '/php-watch/rfcs/accepted',
    handler,
    maintainers: ['syutingsong'],
    name: 'PHP RFCs',
    parameters: {
        status: {
            description: 'The status of the RFC',
            options: [
                {
                    label: 'Accepted',
                    value: 'accepted',
                },
                {
                    label: 'Implemented',
                    value: 'implemented',
                },
                {
                    label: 'Declined',
                    value: 'declined',
                },
            ],
        },
    },
};

async function linkToFeed(url: URL): Promise<DataItem> {
    const $ = await fromURL(url);

    const createTime = $('tr.rfc-info-item')
        .toArray()
        .filter((tr) => $(tr).find('label').text().trim() === 'Created on')
        .map((tr) => $(tr).find('time').attr('datetime'))
        .pop();

    return {
        title: $('h1.title').text(),
        link: url.href,
        description: $('section.content').html()?.trim(),
        pubDate: createTime ? parseDate(createTime) : undefined,
    };
}

async function handler(ctx: Context): Promise<Data> {
    const status = z.enum(['accepted', 'implemented', 'declined']).parse(ctx.req.param('status'));

    const baseUrl = 'https://php.watch/rfcs';
    const $ = await fromURL(baseUrl);

    return {
        title: `PHP ${ucFirst(status)} RFCs`,
        item: await Promise.all(
            $('article')
                .toArray()
                .filter((el) => $(el).find('span.tag.rfc-status').text().toLowerCase() === status)
                .map((el) => withBaseUrl(baseUrl)($(el).find('h3.title>a').attr('href')))
                .filter((url) => !!url)
                .map((url) => linkToFeed(url))
        ),
        allowEmpty: true,
    };
}
