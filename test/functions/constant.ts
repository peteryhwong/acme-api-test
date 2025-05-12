import * as localJson from '../../resource/local.json';

export const ENV = process.env;

export const LOCAL: typeof localJson = {
    ...localJson,
    controller: {
        ...localJson.controller,
        baseUrl: process.env.CONTROLLER_BASE_URL ?? localJson.controller.baseUrl,
    },
    user: {
       ...localJson.user,
        baseUrl: process.env.USER_BASE_URL?? localJson.user.baseUrl,
    },
};

export const PLATFORM_USERNAME = ENV.PLATFORM_USERNAME;
export const PLATFORM_PASSWORD = ENV.PLATFORM_PASSWORD;
export const LOCATION = ENV.LOCATION;
export const DEVICE = ENV.DEVICE;
export const ASSIGNEE = ENV.ASSIGNEE;
export const USER = ENV.USER;

// check and get env variable
export function checkAndGetEnvVariable(variable: string | undefined): string {
    if (variable === undefined) {
        throw new Error(`Environment variable ${variable} is not set`);
    }
    return variable;
}
