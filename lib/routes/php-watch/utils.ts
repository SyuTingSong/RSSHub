export function withBaseUrl(baseUrl: string) {
    return function (partialUrl: string | undefined | null): URL | undefined {
        if (partialUrl === undefined || partialUrl === null) {
            return undefined;
        }

        return new URL(partialUrl, baseUrl);
    };
}
