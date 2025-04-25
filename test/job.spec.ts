import { getAssigneeId } from './functions/assignee';
import { acknowledge, getCommand, getDeviceCommands, sendPing } from './functions/command';
import { ASSIGNEE, checkAndGetEnvVariable, DEVICE, LOCATION, USER } from './functions/constant';
import { getDeviceByCode } from './functions/device';
import { createDeviceJob, getJob } from './functions/job';
import { getLocations } from './functions/location';
import { loginAsPlatformUser } from './functions/login';
import { createDeviceReport } from './functions/report';
import { getUserByUserNumber } from './functions/user';
import { checkApiWithRetries } from './functions/wait';

describe(`Add a job`, () => {
    it('Add a job', async () => {
        const jwtToken = await loginAsPlatformUser();
        console.log(`Got token ${jwtToken}`);

        const locationName = checkAndGetEnvVariable(LOCATION);
        console.log(`Getting location ${locationName}`);
        const locationId = await getLocations(jwtToken, locationName);
        if (!locationId) {
            throw new Error(`Location ${locationName} not found`);
        }

        // get device
        const deviceCode = checkAndGetEnvVariable(DEVICE);
        console.log(`Getting device ${deviceCode}`);
        const device = await getDeviceByCode(jwtToken, deviceCode);
        if (!device) {
            throw new Error(`Device ${deviceCode} not found`);
        }

        // get assignee
        const assigneeUsername = checkAndGetEnvVariable(ASSIGNEE);
        console.log(`Getting assignee ${assigneeUsername}`);
        const assigneeId = await getAssigneeId(jwtToken, assigneeUsername);
        if (!assigneeId) {
            throw new Error(`Assignee ${assigneeUsername} not found`);
        }

        // get user
        const userNumber = checkAndGetEnvVariable(USER);
        console.log(`Getting user ${userNumber}`);
        const userId = await getUserByUserNumber(jwtToken, userNumber);
        if (!userId) {
            throw new Error(`User ${userNumber} not found`);
        }

        console.log(`Getting command`);
        const beforePing = await getCommand(deviceCode);
        const commandId = await sendPing(jwtToken, device.deviceId); // send ping to check device
        if (!commandId) {
            throw new Error(`Ping command not found`);
        }
        // check one more command is added
        const afterPing = await getCommand(deviceCode);
        expect(afterPing).toHaveLength(beforePing.length + 1);
        // command id is there
        expect(afterPing.map(cmd => cmd.id)).toContainEqual(commandId);
        console.log(`Got command ${JSON.stringify(afterPing)}`);

        const deviceCommands = await getDeviceCommands(jwtToken, device.deviceId);
        // check ping commnand is pending
        expect(deviceCommands?.find(command => command.id === commandId && command.status === 'pending')).toBeTruthy();

        console.log(`Acknowledge command`);
        await acknowledge(deviceCode, commandId);

        console.log(`Wait and check acknowledged`);
        await checkApiWithRetries(
            () => getDeviceCommands(jwtToken, device.deviceId),
            5,
            30,
            deviceCommands => deviceCommands?.some(command => command.id === commandId && command.status === 'acknowledged') === true,
        );
        console.log(`Command acknowledged`);

        console.log(`Create job`);
        const deviceId = device.deviceId;
        const jobId = await createDeviceJob(jwtToken, {
            deviceId,
            assigneeId,
            userId,
        });
        console.log(`Created job ${jobId}`);

        console.log(`Get job`);
        const job = await getJob(jwtToken, jobId);
        console.log(`Got job ${JSON.stringify(job)}`);
        expect(job.jobHistory).toHaveLength(0);

        console.log(`Getting command`);
        const jobcommands = await getCommand(deviceCode);
        expect(jobcommands).toHaveLength(1);
        console.log(`Got command ${JSON.stringify(jobcommands)}`);

        console.log(`Acknowledge command`);
        await acknowledge(deviceCode, jobcommands[0].id);

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
