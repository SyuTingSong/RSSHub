export function withBaseUrl(baseUrl: string) {
    return function (partialUrl: string | undefined | null): URL | undefined {
        if (partialUrl === undefined || partialUrl === null) {
            return undefined;
        }

        return new URL(partialUrl, baseUrl);
    };
}

export function ucFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
