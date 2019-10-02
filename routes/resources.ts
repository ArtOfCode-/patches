import * as express from 'express';
import * as mt from 'mysql';
import {requireAuth} from '../user_helpers';
import {render, error} from '../render_helpers';
import {parameters, pp} from '../query_helpers';
import {User} from '../models/user';
import {Resource} from '../models/resource';
import {ResourceAssignment} from '../models/resource_assignment';
import {ResourceStatus} from '../models/resource_status';
import {ResponseWithLayout} from '../definitions';
const router = express.Router(); // eslint-disable-line new-cap

export default (pool: mt.Pool, log): express.Router => {
    router.post('/query', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const resourceType = req.body['resourceType'] || null;
        const statuses = req.body['statuses'] || null;
        const params = {};
        if (resourceType) {
            params['type_id'] = resourceType;
        }
        if (statuses) {
            params['status_id'] = statuses;
        }
        const resources = await Resource.where(params).get();
        render(req, res, resources.map(r => r.attribs), {}, {pool});
    });

    router.get('/incident/:incidentId', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const assignments: ResourceAssignment[] = <ResourceAssignment[]>await ResourceAssignment.where({incident_id: req.params['incidentId']}).get();
        const resources = await Resource.join('resource_statuses', 'status_id', 'id')
                                        .join('resource_types', 'type_id', 'id')
                                        .where({resources: {id: assignments.map(x => x.resource_id)}})
                                        .select('resources.*, resource_statuses.name as status_name, resource_types.name as type_name').get();
        render(req, res, resources.map(x => x.attribs), {}, {pool});
    });

    router.post('/incident/:incidentId', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);

        const incidentId = parseInt(req.params['incidentId'], 10);
        const requested = req.body['resources'].map(r => parseInt(r, 10));
        user.createAudit('resource.assign', 'incidents', incidentId, `Assigned: ${pp(requested)}`);

        const status: ResourceStatus = await <Promise<ResourceStatus>>ResourceStatus.findBy({name: 'Assigned En Route'});
        const promises = [];
        requested.forEach(async resourceId => {
            promises.push(ResourceAssignment.create({incident_id: incidentId, resource_id: resourceId, user_id: user.id}));
            promises.push((await Resource.find(resourceId)).update({status_id: status.id}));
        });
        await Promise.all(promises);
        render(req, res, {status: 'Accepted'}, {}, {pool, status: 202});
    });

    router.delete('/incident/:incidentId', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);

        const incidentId = parseInt(req.params['incidentId'], 10);
        const requested = req.body['resources'];
        user.createAudit('resource.unassign', 'incidents', incidentId, `Unassigned: ${pp(requested)}`);

        const status: ResourceStatus = await <Promise<ResourceStatus>>ResourceStatus.findBy({name: 'Clear'});
        const promises = [];
        requested.forEach(async resourceId => {
            promises.push((await ResourceAssignment.findBy({resource_id: resourceId, incident_id: incidentId})).destroy());
            promises.push((await Resource.find(resourceId)).update({status_id: status.id}));
        });
        await Promise.all(promises);
        render(req, res, {status: 'Accepted'}, {}, {pool, status: 202});
    });

    router.get('/:id', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const resource = await Resource.join('resource_statuses', 'status_id', 'id')
                                       .join('resource_types', 'type_id', 'id')
                                       .where({resources: {id: req.params['id']}})
                                       .select('resources.*, resource_statuses.name as status_name, resource_types.name as type_name').get();
        if (resource.length > 0) {
            render(req, res, resource[0].attribs, {}, {pool});
        }
        else {
            render(req, res, {}, {}, {pool});
        }
    });

    router.post('/:id/status', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);

        const statusId = req.body['status'];
        const resource: Resource = await <Promise<Resource>>Resource.find(req.params['id']);

        user.createAudit('resource.update_status', 'resources', resource.id, `New status: ${statusId}`);

        await resource.update({status_id: statusId});
        render(req, res, {status: 'Accepted'}, {}, {status: 202, pool});
    });

    return router;
};