import * as express from 'express';
import * as mt from 'mysql';
import {requireAuth} from '../user_helpers';
import {render, error} from '../render_helpers';
import {parameters, query, objectFilter} from '../query_helpers';
import {User} from '../models/user';
import {Incident} from '../models/incident';
import {IncidentStatus} from '../models/incident_status';
import {ResourceAssignment} from '../models/resource_assignment';
import {ResourceStatus} from '../models/resource_status';
import {Resource} from '../models/resource';
import {ResponseWithLayout} from '../definitions';
const router = express.Router(); // eslint-disable-line new-cap

export default (pool: mt.Pool, log): express.Router => {
    router.post('/new', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const {lat, lng, priority, description}: any = parameters(req, {
            lat: {required: true},
            lng: {required: true},
            priority: {required: true},
            description: {required: true}
        });
        try {
            const incident: Incident = await <Promise<Incident>>Incident.create({lat, lng, priority, description, status_id: 1});
            user.createAudit('incident.create', 'incidents', incident.id);
            render(req, res, {id: incident.id}, {}, {pool});
        }
        catch (err) {
            render(req, res, {error: err}, {}, {pool});
        }
    });

    router.get('/active', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const statuses: IncidentStatus[] = await <Promise<IncidentStatus[]>>IncidentStatus.where({name: 'Open'}).get();
        const incidents = await Incident.where({status_id: statuses.map(s => s.id)}).get();
        render(req, res, incidents.map(i => i.attribs), {}, {pool});
    });

    router.get('/:id', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const incident = await Incident.find(req.params['id']);
        render(req, res, incident.attribs, {}, {pool});
    });

    router.post('/:id', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const incident = await Incident.find(req.params['id']);
        const {lat, lng, priority, description}: any = parameters(req, {
            lat: {required: false},
            lng: {required: false},
            priority: {required: false},
            description: {required: false}
        });

        user.createAudit('incident.update', 'incidents', parseInt(req.params['id'], 10));

        await incident.update(objectFilter({lat, lng, priority, description}, (k, v) => !!v));
        render(req, res, {status: 'Accepted'}, {}, {status: 202, pool});
    });

    router.post('/:id/close', async (req: express.Request, res: ResponseWithLayout) => {
        const user = await requireAuth(req, res, pool);
        user.createAudit('incident.close', 'incidents', parseInt(req.params['id'], 10));

        const incident: Incident = await <Promise<Incident>>Incident.find(req.params['id']);
        const closed: IncidentStatus = await <Promise<IncidentStatus>>IncidentStatus.findBy({name: 'Closed'});
        incident.update({status_id: closed.id});

        const clear: ResourceStatus = await <Promise<ResourceStatus>>ResourceStatus.findBy({name: 'Clear'});

        await query(pool, [[clear.id, incident.id]], 
            `UPDATE resources SET status_id = ? WHERE id IN (select resource_id from resource_assignments where incident_id = ?);`);
        await query(pool, [[incident.id]],
            `DELETE FROM resource_assignments WHERE incident_id = ?;`);

        render(req, res, {status: 'Accepted'}, {}, {status: 202, pool});
    });

    return router;
};