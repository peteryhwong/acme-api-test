import * as client from './client/controller';
import { LOCAL } from './constant';

// get user name by user number
export async function getUserByUserNumber(jwtToken: string, userNumber: string) {
    const users = await client.getUsers({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    const user = users.data?.user?.find(user => user.userNumber === userNumber)?.userId;
    return user;
}
