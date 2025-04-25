export function base64Encode(input: string): string {
    return Buffer.from(input).toString('base64');
}

export function basicAuth(username: string, password: string): string {
    return `Basic ${base64Encode(`${username}:${password}`)}`;
}
