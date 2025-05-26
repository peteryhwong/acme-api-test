import { basicAuth } from './basic';
import * as client from './client/controller';
import { LOCAL } from './constant';
import { createTreatmentSnapshot } from './treatment';

export async function createDeviceReport(req: {
    deviceCode: string,
    jobHistory: Omit<client.JobHistory, 'detail'> & { detail: Omit<client.JobHistory['detail'], 'treatment'> },
    treatment?: client.TreatmentSnapshot,
    plan?: client.ProNewPlanSnapshot,
}) {
    const { deviceCode, jobHistory, treatment, plan, } = req;
    const selectedTreatment = treatment ?? createTreatmentSnapshot();
    const selectedPlan = plan ?? selectedTreatment.detail.plan;
    const res = await client.createDeviceReportWithKey({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: basicAuth(deviceCode, '12345678'),
        },
        body: {
            detail: [
                {
                    ...jobHistory,
                    detail: {
                        ...jobHistory.detail,
                        treatment: {
                            ...selectedTreatment,
                            detail: {
                                ...selectedTreatment.detail,
                                plan: selectedPlan,
                            } 
                        },
                    },
                },
            ],
        },
    });
    expect(res.data?.code).toEqual(201);
    expect(res.data?.message).toEqual('Report created');
    if (!res.data?.object?.reportId) {
        throw new Error(`no reportId found`);
    }
    return res.data.object.reportId;
}
