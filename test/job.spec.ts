import { getAssigneeId } from './functions/assignee';
import * as client from './functions/client/controller';
import { acknowledge, getCommand, getDeviceCommands, sendPing } from './functions/command';
import { ASSIGNEE, checkAndGetEnvVariable, DEVICE, PLATFORM_PASSWORD, PLATFORM_USERNAME, USER } from './functions/constant';
import { getDeviceByCode } from './functions/device';
import { createDeviceJob, getJob } from './functions/job';
import { loginAsPlatformUser } from './functions/login';
import { createDeviceReport } from './functions/report';
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

    console.log(`Create job`);
    const result = await createDeviceJob(jwtToken, {
        deviceId,
        assigneeId,
        userId,
    });
    console.log(`Created job ${result.jobId}`);

    console.log(`Get job`);
    const job = await getJob(jwtToken, result.jobId);
    console.log(`Got job ${JSON.stringify(job)}`);
    expect(job.jobHistory).toHaveLength(0);
    return result;
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

function isProNewPlanSetting(plan: client.ProSetting['plan']): plan is client.ProNewPlanSetting {
    return 'preset' in plan && 'plan' in plan.preset.pronew001;
}

function presetToPlan(preset: client.ProNewPlanSetting['preset']): client.ProNewPlanSnapshot {
    console.log(`Select 'pronew001' preset as plan`);
    return {
        plan: {
            tens: preset.pronew001.plan.tens,
            ultrasound: preset.pronew001.plan.ultrasound,
        },
        name: 'pronew001',
    };
}

describe(`Add a job to device and have the device report back status to completion`, () => {
    if (process.env.EMULATOR === 'true') {
        it.skip('Skipping tests because EMULATOR is true', () => {});
        return;
    }

    it('Add a job to device and have the device report back status to completion', async () => {
        console.log(`Logging into platform`);
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
        const job = await sendJobToDevice({
            jwtToken,
            deviceId,
            assigneeId,
            userId,
        });
        const plan = job.treatmentPlan.detail.plan;
        if (!isProNewPlanSetting(plan)) {
            throw new Error(`Plan is not ProNewPlanSetting`);
        }
        const jobId = job.jobId;
        const preset = plan.preset;

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
        const report = await createDeviceReport({
            deviceCode,
            jobHistory: {
                detail: {
                    assigneeUsername,
                    status: 'play',
                },
                jobId,
                type: 'interim',
            },
            plan: presetToPlan(preset),
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
        const completionReport = await createDeviceReport({
            deviceCode,
            jobHistory: {
                detail: {
                    assigneeUsername,
                    status: 'complete',
                },
                jobId,
                type: 'completion',
            },
            plan: presetToPlan(preset),
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
