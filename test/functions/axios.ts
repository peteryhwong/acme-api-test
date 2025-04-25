import { client as controllerClient } from './client/controller/client.gen';
import { client as userClient } from './client/user/client.gen';

controllerClient.instance.interceptors.request.use(request => {
    console.log(`Request: ${request.method} ${request.url}`);
    return request;
});

controllerClient.instance.interceptors.response.use(response => {
    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;
});

userClient.instance.interceptors.request.use(request => {
    console.log(`Request: ${request.method} ${request.url}`);
    return request;
});

userClient.instance.interceptors.response.use(response => {
    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;
});
