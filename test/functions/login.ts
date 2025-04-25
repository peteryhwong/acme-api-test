import * as client from './client/user';
import { checkAndGetEnvVariable, LOCAL, PLATFORM_PASSWORD, PLATFORM_USERNAME } from './constant';

// login as platform user where username and password supplied via env variable
export async function loginAsPlatformUser() {
    const res = await client.createToken({
        baseURL: LOCAL.user.baseUrl,
        body: {
            username: checkAndGetEnvVariable(PLATFORM_USERNAME),
            password: checkAndGetEnvVariable(PLATFORM_PASSWORD),
        },
    });
    if (!res.data?.token) {
        throw new Error('Failed to login as platform user');
    }
    return res.data.token;
}
