import {BaseModel} from './base';

export class IncidentStatus extends BaseModel {
    id: number;
    name: string;
    description: string;

    static get tableName() {
        return 'incident_statuses';
    }

    get tableName() {
        return 'incident_statuses';
    }
}
