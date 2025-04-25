import { basicAuth } from './basic';
import * as client from './client/controller';
import { LOCAL } from './constant';

// send ping command to device
export async function sendPing(jwtToken: string, deviceId: string) {
    const command = await client.sendCommand({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            deviceId,
        },
        body: {
            command: {
                command: 'ping',
            },
        },
    });
    expect(command.status).toEqual(201);
    return command.data?.commandId;
}

export async function getCommand(deviceCode: string) {
    const res = await client.getCommandsWithKey({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: basicAuth(deviceCode, '12345678'),
        },
    });
    if (!res.data?.object?.command) {
        throw new Error(`[getCommand]: no command found`);
    }
    expect(res.data?.code).toEqual(200);
    expect(res.data?.message).toEqual('Commands found');
    return res.data.object.command;
}

export async function acknowledge(deviceCode: string, commandId: string) {
    const response = await client.acknowledgeCommandWithKey({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: basicAuth(deviceCode, '12345678'),
        },
        body: {
            type: 'acknowledgement',
            detail: {
                commandId: [commandId],
            },
        },
    });
    console.log(response.data);
}

// get device commands
export async function getDeviceCommands(jwtToken: string, deviceId: string) {
    const res = await client.getCommands({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            deviceId,
        },
    });
    expect(res.status).toEqual(200);
    return res.data?.command;
}
