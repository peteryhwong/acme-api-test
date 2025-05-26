import * as client from './client/controller';
import { LOCAL } from './constant';
import { DEFAULT_TREATMENT_PLAN, DEFAULT_TREATMENT_PLAN_PLAN } from './treatment';

export async function createDeviceJob(jwtToken: string, opt: { deviceId: string; assigneeId: string; userId: string; treatmentPlan?: client.BaseJob['treatmentPlan'], preset?: client.ProNewPlanSetting['preset'] }): Promise<string> {
    const { deviceId, assigneeId, userId, treatmentPlan, preset } = opt;
    const res = await client.createJob({
        baseURL: LOCAL.controller.baseUrl,
        path: {
            deviceId,
        },
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        body: {
            assigneeId,
            userId,
            treatmentPlan: {
                ...treatmentPlan ?? DEFAULT_TREATMENT_PLAN,
                detail: {
                    ...DEFAULT_TREATMENT_PLAN.detail,
                    plan: {
                        ...DEFAULT_TREATMENT_PLAN.detail.plan,
                        preset: preset ?? DEFAULT_TREATMENT_PLAN_PLAN.preset,
                    },
                },
            },
        },
    });
    if (!res.data?.jobId) {
        throw new Error('create job failed');
    }
    return res.data.jobId;
}

export async function getJob(jwtToken: string, jobId: string) {
    const res = await client.getJobById({
        baseURL: LOCAL.controller.baseUrl,
        path: {
            jobId,
        },
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    if (!res.data) {
        throw new Error('get job failed');
    }
    return res.data;
}

// get all jobs
export async function getJobs(jwtToken: string) {
    const res = await client.getJobs({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    if (!res.data?.job) {
        throw new Error('get jobs failed');
    }
    return res.data.job;
}
