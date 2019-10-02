import {BaseModel} from './base';

export class ResourceAssignment extends BaseModel {
    incident_id: number;
    resource_id: number;
    user_id: number;

    static get tableName() {
        return 'resource_assignments';
    }

    get tableName() {
        return 'resource_assignments';
    }
}
