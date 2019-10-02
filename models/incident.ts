import {BaseModel} from './base';

export class Incident extends BaseModel {
    id: number;
    lat: number;
    lng: number;
    priority: number;
    description: string;
    status_id: number;

    static get tableName() {
        return 'incidents';
    }

    get tableName() {
        return 'incidents';
    }
}
