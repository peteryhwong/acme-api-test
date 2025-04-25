import * as client from './client/controller';
import { LOCAL } from './constant';

export async function getDevices(jwtToken: string) {
    const res = await client.listDevices({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    if (!res.data) {
        expect(res.data).toBeDefined();
        throw new Error('res.data is not defined');
    }
    return res.data;
}

// get device by code
export async function getDeviceByCode(jwtToken: string, code: string) {
    const res = await client.listDevices({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    if (!res.data) {
        expect(res.data).toBeDefined();
        throw new Error('res.data is not defined');
    }
    return res.data.devices.find(device => device.code === code);
}

// get a device
export async function getDevice(jwtToken: string, deviceId: string) {
    const res = await client.getDeviceById({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            deviceId,
        },
    });
    expect(res.status).toEqual(200);
    expect(res.data?.deviceId).toEqual(deviceId);
    if (!res.data) {
        expect(res.data).toBeDefined();
        throw new Error('res.data is not defined');
    }
    return res.data;
}

// delete device
export async function deleteDevice(jwtToken: string, deviceId: string) {
    const res = await client.deleteDevice({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            deviceId,
        },
    });
    expect(res.status).toEqual(200);
    // check if device is deleted
    const devices = await client.listDevices({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    expect(devices.data?.devices.map(device => device.deviceId)).not.toContainEqual(deviceId);
}
