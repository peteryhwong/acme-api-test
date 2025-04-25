import { readFileSync } from 'fs';
import { sign } from 'jsonwebtoken';
import { resolve } from 'path';

const jwtKey = readFileSync(resolve(__dirname, '../../resource/private.key'), 'utf8');
const jwtPublicKey = readFileSync(resolve(__dirname, '../../resource/public.key'), 'utf8');
const ttl = 86400;

export function getPublicKey() {
    return jwtPublicKey;
}

export function getTokenWithRoles(roles = ['robot_user']) {
    return getToken({ username: 'username', userId: '687315fc-215c-4895-99de-ca73e61190a2', roles });
}

function getToken(payload: Record<string, any>) {
    return sign(payload, jwtKey, {
        algorithm: 'RS256',
        expiresIn: ttl,
        issuer: 'user',
    });
}
