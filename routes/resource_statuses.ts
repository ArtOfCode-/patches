import * as express from 'express';
import * as mt from 'mysql';
import {requireAuth} from '../user_helpers';
import {render, error} from '../render_helpers';
import {parameters} from '../query_helpers';
import {User} from '../models/user';
import {ResourceStatus} from '../models/resource_status';
import {ResponseWithLayout} from '../definitions';
const router = express.Router(); // eslint-disable-line new-cap

export default (pool: mt.Pool, log): express.Router => {
    router.get('/', async (req: express.Request, res: ResponseWithLayout) => {
        const user: User = await requireAuth(req, res, pool);
        const statuses = await ResourceStatus.get();
        render(req, res, statuses.map(s => s.attribs), {}, {pool});
    });

    return router;
}