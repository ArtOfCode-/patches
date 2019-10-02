import * as express from 'express';
import * as mysql from 'mysql';
import * as debug from 'debug';

import users from '../routes/users';
import dashboard from '../routes/dashboard';
import incidents from '../routes/incidents';
import resources from '../routes/resources';
import resourceTypes from '../routes/resource_types';
import resourceStatuses from '../routes/resource_statuses';

export const routes: {[key: string]: Function} = {
    '/users': users,
    '/': dashboard,
    '/incidents': incidents,
    '/resources': resources,
    '/resource-types': resourceTypes,
    '/resource-statuses': resourceStatuses
};