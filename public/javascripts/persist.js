window.patches = window.patches || {};

const requestJSON = async (path, method = 'GET', body = {}) => {
    const resp = await fetch((method === 'GET' || method === 'HEAD') && Object.keys(body).length > 0 ? path + '?' + $.param(body) : path, Object.assign({
        credentials: 'include',
        method
    }, method !== 'GET' && method !== 'HEAD' ? {body: JSON.stringify(body), headers: {'Content-Type': 'application/json'}} : {}));
    const data = await resp.json();
    return data;
};

Object.assign(window.patches, {
    persist: {
        createIncident: async (lat, lng, priority, description) => {
            const data = await requestJSON('/incidents/new', 'POST', {
                lat, lng, priority, description
            });
            if (data.error) {
                throw data.error;
            }
            else {
                return data.id;
            }
        },

        getIncident: async id => {
            return await requestJSON(`/incidents/${id}`);
        },

        getActiveIncidents: async () => {
            return await requestJSON('/incidents/active');
        },

        closeIncident: async incidentId => {
            return await requestJSON(`/incidents/${incidentId}/close`, 'POST');
        },

        editIncident: async (incidentId, {lat, lng, priority, description}) => {
            const attribs = Object.filter({lat, lng, priority, description}, (k, v) => !!v);
            return await requestJSON(`/incidents/${incidentId}`, 'POST', attribs);
        },



        getResourceStatuses: async () => {
            return await requestJSON('/resource-statuses');
        },



        getResourceTypes: async () => {
            return await requestJSON('/resource-types');
        },



        getResources: async (resourceType, statuses = [1]) => {
            return await requestJSON('/resources/query', 'POST', {
                resourceType, statuses
            });
        },

        getIncidentResources: async incidentId => {
            return await requestJSON(`/resources/incident/${incidentId}`);
        },

        getResource: async resourceId => {
            return await requestJSON(`/resources/${resourceId}`);
        },

        dispatchResources: async (incidentId, resources) => {
            return await requestJSON(`/resources/incident/${incidentId}`, 'POST', {
                resources
            });
        },

        cancelDispatch: async (incidentId, resources) => {
            return await requestJSON(`/resources/incident/${incidentId}`, 'DELETE', {
                resources
            });
        },

        updateResourceStatus: async (resourceId, statusId) => {
            return await requestJSON(`/resources/${resourceId}/status`, 'POST', {
                status: statusId
            });
        }
    }
});