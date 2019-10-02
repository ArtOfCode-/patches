import {BaseModel} from './base';
import {Audit} from './audit';

export class User extends BaseModel {
    id: number;
    username: string;

    static get tableName() {
        return 'users';
    }

    get tableName() {
        return 'users';
    }

    async createAudit(eventType: string, referenceType: string, referenceId: number, comment?: string): Promise<Audit> {
        const attribs = {event_type: eventType, reference_type: referenceType, reference_id: referenceId, user_id: this.id};
        if (comment) {
            attribs['comment'] = comment;
        }
        return await <Promise<Audit>>Audit.create(attribs);
    }
}
