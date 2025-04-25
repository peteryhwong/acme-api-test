import * as client from './client/controller';
import { LOCAL } from './constant';

// get location by name
export async function getLocations(jwtToken: string, name: string) {
    const res = await client.getLocations({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    return res.data?.location?.find(location => location.name === name)?.locationId;
}
