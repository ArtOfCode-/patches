import {BaseModel} from './base';

export class Audit extends BaseModel {
    id: number;
    event_type: string;
    reference_type: string;
    reference_id: number;
    user_id: number;
    comment: string;
    created_at: string;
    updated_at: string;

    static get tableName() {
        return 'audits';
    }

    get tableName() {
        return 'audits';
    }
}