import * as client from './client/controller';
import { LOCAL } from './constant';

export async function updateTreatmentPlan(jwtToken: string, name: string, plan: { tens: number; ultrasound: number }): Promise<client.TreatmentPlanWithVersionAndName> {
    const result = await client.updateTreatmentPlan({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            name,
        },
        body: {
            plan: {
                tens: plan.tens,
                ultrasound: plan.ultrasound,
            },
            type: 'pronew',
        },
    });
    if (!result.data) {
        throw new Error(`[updateTreatmentPlan]: fail to update treatment plan ${name}`);
    }
    return result.data;
}

export async function getTreatmentPlanByName(jwtToken: string, name: string): Promise<client.TreatmentPlanWithVersionAndName> {
    const result = await client.getTreatmentPlanByName({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        path: {
            name,
        },
    });
    if (!result.data) {
        throw new Error(`[getTreatmentPlanByName]: fail to get treatment plan ${name}`);
    }
    return result.data;
}

export async function getAllTreatmentPlans(jwtToken: string) {
    const result = await client.getTreatmentPlan({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    if (!result.data?.treatmentplan) {
        throw new Error(`[getAllTreatmentPlans] fail to get treatment plans`);
    }
    return result.data.treatmentplan;
}
