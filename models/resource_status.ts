import {BaseModel} from './base';

export class ResourceStatus extends BaseModel {
    id: number;
    name: string;
    description: string;

    static get tableName() {
        return 'resource_statuses';
    }

    get tableName() {
        return 'resource_statuses';
    }
}
