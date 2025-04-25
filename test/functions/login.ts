import * as client from './client/user';
import { LOCAL } from './constant';

// login as platform user where username and password supplied via env variable
export async function loginAsPlatformUser(username: string, password: string) {
    const res = await client.createToken({
        baseURL: LOCAL.user.baseUrl,
        body: {
            username,
            password,
        },
    });
    if (!res.data?.token) {
        throw new Error('Failed to login as platform user');
    }
    return res.data.token;
}
