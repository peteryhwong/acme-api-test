import * as client from './client/controller';
import { LOCAL } from './constant';

// get assignee by username
export async function getAssigneeId(jwtToken: string, username: string) {
    const assignees = await client.getAssignees({
        baseURL: LOCAL.controller.baseUrl,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
    });
    return assignees.data?.assignee.find(assignee => assignee.username === username)?.assigneeId;
}
