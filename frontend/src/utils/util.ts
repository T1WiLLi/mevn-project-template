export function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : undefined;
}

/**
 * 
 * @param name The name of the cookie to be set
 * @param expire The time in minutes until the cookie expires (Nothing for undying cookie)
 */
export function setCookie(name: string, value: string, expire?: number): void | undefined {
    if (typeof document === 'undefined') return;

    const date = new Date();
    date.setTime(
        expire !== undefined
            ? date.getTime() + expire * 60 * 1000
            : date.getTime() + 100 * 365 * 24 * 60 * 60 * 1000
    );
    const expires = `;expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}${expires};path=/`;
}

