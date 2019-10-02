import {BaseModel} from './base';

export class Resource extends BaseModel {
    id: number;
    type_id: number;
    name: string;
    status_id: number;
    base_lat: number;
    base_lng: number;
    lat: number;
    lng: number;

    static get tableName() {
        return 'resources';
    }

    get tableName() {
        return 'resources';
    }
}
