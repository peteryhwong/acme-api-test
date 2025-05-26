import { getAssigneeId } from './functions/assignee';
import * as client from './functions/client/controller';
import { acknowledge, getCommand, getDeviceCommands, sendPing } from './functions/command';
import { ASSIGNEE, checkAndGetEnvVariable, DEVICE, PLATFORM_PASSWORD, PLATFORM_USERNAME, USER } from './functions/constant';
import { getDeviceByCode } from './functions/device';
import { createDeviceJob, getJob } from './functions/job';
import { loginAsPlatformUser } from './functions/login';
import { createDeviceReport } from './functions/report';
import { DEFAULT_TREATMENT_PLAN_PLAN } from './functions/treatment';
import { getAllTreatmentPlans, getTreatmentPlanByName, updateTreatmentPlan } from './functions/treatmentplan';
import { getUserByUserNumber } from './functions/user';
import { checkApiWithRetries } from './functions/wait';

async function prepareJobContent(req: { jwtToken: string; deviceCode: string; assigneeUsername: string; userNumber: string }) {
    const { jwtToken, deviceCode, assigneeUsername, userNumber } = req;

    // get device
    console.log(`Getting device ${deviceCode}`);
    const device = await getDeviceByCode(jwtToken, deviceCode);
    if (!device) {
        throw new Error(`Device ${deviceCode} not found`);
    }

    // get assignee
    console.log(`Getting assignee ${assigneeUsername}`);
    const assigneeId = await getAssigneeId(jwtToken, assigneeUsername);
    if (!assigneeId) {
        throw new Error(`Assignee ${assigneeUsername} not found`);
    }

    // get user
    console.log(`Getting user ${userNumber}`);
    const userId = await getUserByUserNumber(jwtToken, userNumber);
    if (!userId) {
        throw new Error(`User ${userNumber} not found`);
    }

    return {
        deviceId: device.deviceId,
        assigneeId,
        userId,
    };
}

async function sendPingToDevice(req: { jwtToken: string; deviceId: string }) {
    const { jwtToken, deviceId } = req;
    const commandId = await sendPing(jwtToken, deviceId); // send ping to check device
    if (!commandId) {
        throw new Error(`Ping command not found`);
    }
    console.log(`Sent ping to device ${deviceId}`);
    return commandId;
}

async function sendJobToDevice(req: { jwtToken: string; deviceId: string; assigneeId: string; userId: string }) {
    const { jwtToken, deviceId, assigneeId, userId } = req;

    console.log(`Create job preset`);
    const preset = await createJobPreset(jwtToken);
    console.log(`Created job preset ${JSON.stringify(preset)}`);

    console.log(`Create job`);
    const jobId = await createDeviceJob(jwtToken, {
        deviceId,
        assigneeId,
        userId,
        preset,
    });
    console.log(`Created job ${jobId}`);

    console.log(`Get job`);
    const job = await getJob(jwtToken, jobId);
    console.log(`Got job ${JSON.stringify(job)}`);
    expect(job.jobHistory).toHaveLength(0);
    return jobId;
}

describe(`Test with an emulated device`, () => {
    if (process.env.EMULATOR !== 'true') {
        it.skip('Skipping tests because EMULATOR is not true', () => {});
        return;
    }

    it('Add a job to device', async () => {
        console.log(`Login as platform user`);
        const jwtToken = await loginAsPlatformUser(checkAndGetEnvVariable(PLATFORM_USERNAME), checkAndGetEnvVariable(PLATFORM_PASSWORD));
        console.log(`Got token ${jwtToken}`);

        const deviceCode = checkAndGetEnvVariable(DEVICE);
        const assigneeUsername = checkAndGetEnvVariable(ASSIGNEE);

        console.log(`Prepare job content`);
        const { deviceId } = await prepareJobContent({
            jwtToken,
            deviceCode,
            assigneeUsername,
            userNumber: checkAndGetEnvVariable(USER),
        });

        console.log(`Send ping to device`);
        const pingId = await sendPingToDevice({
            jwtToken,
            deviceId,
        });

        console.log(`Wait and check acknowledged`);
        await checkApiWithRetries(
            () => getDeviceCommands(jwtToken, deviceId),
            5,
            30,
            deviceCommands => deviceCommands?.some(command => command.id === pingId && command.status === 'acknowledged') === true,
        );
    }, 60000);
});

async function createJobPreset(jwtToken: string): Promise<client.ProNewPlanSetting['preset']> {
    const plans = await getAllTreatmentPlans(jwtToken);
    console.log(`Got ${plans.length} treatment plans`);
    if (plans.length !== 8) {
        throw new Error(`Expected 8 treatment plans, got ${plans.length}`);
    }

    const preset: client.ProNewPlanSetting['preset'] = Object.assign({}, DEFAULT_TREATMENT_PLAN_PLAN.preset);
    let name: keyof typeof DEFAULT_TREATMENT_PLAN_PLAN.preset;
    for (name in DEFAULT_TREATMENT_PLAN_PLAN.preset) {
        let plan = await getTreatmentPlanByName(jwtToken, name);
        if (plan.plan.tens === 0 && plan.plan.ultrasound === 0) {
            const planSetup = DEFAULT_TREATMENT_PLAN_PLAN.preset[name].plan;
            await updateTreatmentPlan(jwtToken, name, planSetup);
            if (plan.plan.tens !== planSetup.tens) {
                throw new Error(`Plan ${name} tens is not ${planSetup.tens}`);
            }
            if (plan.plan.ultrasound !== planSetup.ultrasound) {
                throw new Error(`Plan ${name} ultrasound is not ${planSetup.ultrasound}`);
            }
            plan = await getTreatmentPlanByName(jwtToken, name);
        }
        preset[name] = {
            type: 'pronew',
            plan: {
                tens: plan.plan.tens,
                ultrasound: plan.plan.ultrasound,
            },
            version: plan.version.toString(),
            customizable: false,
            enabled: true,
        };
    }
    return preset;
}

describe(`Add a job to device and have the device report back status to completion`, () => {
    if (process.env.EMULATOR === 'true') {
        it.skip('Skipping tests because EMULATOR is true', () => {});
        return;
    }

    it('Add a job to device and have the device report back status to completion', async () => {
        console.log(`Login as platform user`);
        const jwtToken = await loginAsPlatformUser(checkAndGetEnvVariable(PLATFORM_USERNAME), checkAndGetEnvVariable(PLATFORM_PASSWORD));
        console.log(`Got token ${jwtToken}`);

        const deviceCode = checkAndGetEnvVariable(DEVICE);
        const assigneeUsername = checkAndGetEnvVariable(ASSIGNEE);

        console.log(`Prepare job content`);
        const { assigneeId, deviceId, userId } = await prepareJobContent({
            jwtToken,
            deviceCode,
            assigneeUsername,
            userNumber: checkAndGetEnvVariable(USER),
        });

        console.log(`Send ping to device`);
        const pingId = await sendPingToDevice({
            jwtToken,
            deviceId,
        });

        console.log(`Acknowledge command`);
        await acknowledge(deviceCode, pingId);

        console.log(`Wait and check acknowledged`);
        await checkApiWithRetries(
            () => getDeviceCommands(jwtToken, deviceId),
            5,
            30,
            deviceCommands => deviceCommands?.some(command => command.id === pingId && command.status === 'acknowledged') === true,
        );

        console.log(`Create job`);
        const jobId = await sendJobToDevice({
            jwtToken,
            deviceId,
            assigneeId,
            userId,
        });

        console.log(`Getting command`);
        const jobcommands = await getCommand(deviceCode);
        console.log(`Got commands ${JSON.stringify(jobcommands)}`);
        const jobCommand = jobcommands?.find(command => 'jobId' in command.command && command.command.action === 'create' && command.command.jobId === jobId);
        if (!jobCommand) {
            throw new Error(`Job command not found`);
        }
        console.log(`Got command ${JSON.stringify(jobCommand)}`);

        console.log(`Acknowledge command`);
        await acknowledge(deviceCode, jobCommand.id);

        console.log(`Create report`);
        const report = await createDeviceReport(deviceCode, {
            detail: {
                assigneeUsername,
                status: 'play',
            },
            jobId,
            type: 'interim',
        });
        console.log(`Created report ${report}`);

        console.log(`Wait for job report to be processed`);
        await checkApiWithRetries(
            () => getJob(jwtToken, jobId),
            5,
            30,
            job => job.jobHistory.length > 1 && job.status === 'play',
        );
        console.log(`Job report is processed`);

        console.log(`Create completion report`);
        const completionReport = await createDeviceReport(deviceCode, {
            detail: {
                assigneeUsername,
                status: 'complete',
            },
            jobId,
            type: 'completion',
        });
        console.log(`Created report ${completionReport}`);

        console.log(`Wait for job report to be processed`);
        await checkApiWithRetries(
            () => getJob(jwtToken, jobId),
            5,
            30,
            job => job.jobHistory.length > 1 && job.status === 'complete',
        );
        console.log(`Job report is processed`);
    }, 60000);
});
