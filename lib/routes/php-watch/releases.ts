import { withBaseUrl } from '@/routes/php-watch/utils';
import { Data, Route } from '@/types';
import { fromURL } from 'cheerio';
import { Context } from 'hono';

export const route: Route = {
    path: '/releases/:version',
    example: '/php-watch/releases/8.4',
    handler,
    maintainers: ['syutingsong'],
    name: 'PHP Releases',
};

async function handler(ctx: Context): Promise<Data> {
    const version = ctx.req.param('version');
    const baseUrl = `https://php.watch/versions/${version}/releases`;

    const $ = await fromURL(baseUrl);

    return {
        title: `PHP ${version} Releases`,
        link: baseUrl,
        description: $('main section.container:not(.content)').text(),
        item: await Promise.all(
            $('section.release-timeline .timeline-item')
                .toArray()
                .map(async (el) => {
                    const link = withBaseUrl(baseUrl)($(el).find('.timeline-inner>a:first').attr('href'));

                    if (link === undefined) {
                        return null;
                    }

                    return {
                        title: $(el).find('.timeline-inner>a:first').text(),
                        link,
                        description: await fromURL(link).then(($) => $('article').html()),
                        pubDate: $(el).find('time').first().attr('datetime'),
                    };
                })
        ).then((items) => items.filter((item) => item !== null)),
    };
}
