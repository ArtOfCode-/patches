window.patches = window.patches || {};
Object.assign(window.patches, {
    ui: {
        incidentModal: incident => {
            $(`.js-incident-data[data-prop="description"]`).text(incident.description);

            const priorities = {
                1: 'Life Threatening / Highest Priority',
                2: 'Urgent Care / Medium Priority',
                3: 'Minor Incident / Lower Priority'
            };
            $('.js-incident-data[data-prop="priority"]').text(`${incident.priority}: ${priorities[incident.priority]}`)
                                                        .removeClass('priority-1 priority-2 priority-3')
                                                        .addClass(`priority priority-${incident.priority}`);

            $('#incident-modal').data('incidentId', incident.id).modal('show');
            patches.ui.loadIncidentResources(incident);
        },

        closeIncidentModal: () => {
            $('#incident-modal').data('incidentId', null).modal('hide');
            $('#incident-modal').find('.js-incident-data').text('');
            $('.incident-resources').html('');
            $('.js-resources-spinner').removeClass('hide');
        },

        loadIncidentResources: async incident => {
            const resources = await patches.persist.getIncidentResources(incident.id);
            resources.forEach(r => {
                const $resource = $('#incident-resource-template').clone();
                const nextStatus = patches.getNextStatus(r.status_name);
                $resource.removeClass('hide').attr('data-resource-id', r.id);
                $resource.find('.js-resource-type').text(r.type_name);
                $resource.find('.js-resource-name').text(r.name);
                $resource.find('.js-resource-status').text(r.status_name);
                $resource.find('.js-resource-next-status').text(nextStatus.name).data('nextStatusId', nextStatus.id);
                $resource.find('.resource-cancel').attr('data-resource-id', r.id);
                $('.incident-resources').append($resource);
            });
            if (resources.length === 0) {
                $('.incident-resources').html('No resources yet dispatched.');
            }
            $('.js-resources-spinner').addClass('hide');
        },

        displaySearchOptions: () => {
            $('.search-options').addClass('show');
        },

        removeSearchOptions: () => {
            $('.search-options').removeClass('show');
        },

        createIncidentMarker: (incidentId, incidentData) => {
            const marker = L.marker([incidentData.lat, incidentData.lng], {icon: patches.icons[incidentData.priority], bubblingMouseEvents: false});
            marker.on('click', async evt => {
                evt.originalEvent.preventDefault();
                const match = patches.points.filter(x => x.lat === evt.latlng.lat && x.lng === evt.latlng.lng);
                const incidentId = match.length > 0 ? match[0].id : null;

                if (!incidentId) {
                    throw "Unable to find incident";
                }

                const incidentDetails = await patches.persist.getIncident(incidentId);
                patches.ui.incidentModal(incidentDetails);
            });
            marker.addTo(patches.map);
            patches.points.push({
                id: incidentId,
                lat: parseFloat(incidentData.lat),
                lng: parseFloat(incidentData.lng),
                marker
            });
        },

        changeMarkerPriority: (marker, priority) => {
            marker.setIcon(patches.icons[priority]);
        },

        switchToDispatchModal: () => {
            const incidentId = $('#incident-modal').data('incidentId');
            if (!incidentId) {
                console.warn('patches.ui.switchToDispatchModal() called without available incidentId');
                return;
            }

            $('#incident-modal').modal('hide');
            $('#dispatch-modal').data('incidentId', incidentId).modal('show');
        },

        addDispatchResource: async resourceId => {
            const r = await patches.persist.getResource(resourceId);
            const $resource = $('#dispatch-resource-template').clone();
            $resource.removeClass('hide').attr('data-resource-id', resourceId);
            $resource.find('.js-resource-type').text(r.type_name);
            $resource.find('.js-resource-name').text(r.name);
            $resource.find('.js-resource-status').text(r.status_name);
            $resource.find('.dispatch-resource-cancel').attr('data-resource-id', r.id);

            const resourceIds = $('.dispatch-resources').data('resourceIds') || [];
            resourceIds.push(resourceId);
            $('.dispatch-resources').data('resourceIds', resourceIds).append($resource);
        },

        removeDispatchResource: async resourceId => {
            const resourceIds = $('.dispatch-resources').data('resourceIds') || [];
            const idx = resourceIds.indexOf(resourceId);
            resourceIds.splice(idx, 1);
            $('.dispatch-resources').data('resourceIds', resourceIds);
            $(`.dispatch-resource[data-resource-id="${resourceId}"]`).remove();
        },

        dispatchSelected: async () => {
            $('#js-dispatch-selected').attr('disabled', true);
            const incidentId = $('#dispatch-modal').data('incidentId');
            const resources = ($('.dispatch-resources').data('resourceIds') || []).map(x => parseInt(x, 10));
            if (resources.length === 0) {
                $('#dispatch-modal').modal('hide');
            }
            else {
                await patches.persist.dispatchResources(incidentId, resources);
                const incidentDetails = await patches.persist.getIncident(incidentId);
                $('#dispatch-modal').modal('hide');
                patches.ui.incidentModal(incidentDetails);
            }
        },

        closeDispatchModal: () => {
            $('#dispatch-modal').data('incidentId', null).modal('hide');
            $('.dispatch-resources').data('resourceIds', null).html('');
            $('#js-dispatch-selected').attr('disabled', false);
        },

        cancelDispatch: async resourceId => {
            const incidentId = $('#incident-modal').data('incidentId');
            await patches.persist.cancelDispatch(incidentId, [resourceId]);
            $(`.incident-resource[data-resource-id="${resourceId}"]`).remove();
        }
    }
});

$(() => {
    // Select2 setup
    $('select').select2({
        closeOnSelect: true
    });

    // Search bar setup: display search options when typing, remove when not
    $('.search-bar').on('focus keyup', evt => {
        if ($(evt.target).val().length >= 1) {
            patches.ui.displaySearchOptions();
        }
        else {
            patches.ui.removeSearchOptions();
        }
    });

    $(document).on('click', evt => {
        if ($(evt.target).parents('.search-container').length <= 0) {
            patches.ui.removeSearchOptions();
        }
    });

    // Insert resource types into dispatch form
    (async () => {
        const resourceTypes = await patches.persist.getResourceTypes();
        const rtSelect = $('#dispatch-resource-type');
        resourceTypes.forEach(rt => {
            const option = `<option value="${rt.id}">${rt.name}</option>`;
            $(option).appendTo(rtSelect);
        });
    })();

    // Get available resources on resource type selection
    $('#dispatch-resource-type').on('change', async evt => {
        const type = $(evt.target).val();
        const select = $('#dispatch-resource');
        if (type) {
            const available = await patches.persist.getResources(parseInt(type, 10));
            select.html('<option></option>');
            if (available.length === 0) {
                const option = `<option disabled>No units available.</option>`;
                $(option).appendTo(select);
            }
            available.forEach(r => {
                const option = `<option value="${r.id}">${r.name}</option>`;
                $(option).appendTo(select);
            });
        }
        else {
            select.html('<option></option>');
        }
    });

    // Handle cleanup when incident modal is closed
    $('#incident-modal').on('hidden.bs.modal', () => {
        patches.ui.closeIncidentModal();
    });

    // Change to dispatch modal from incident modal
    $('#js-dispatch-trigger').on('click', evt => {
        patches.ui.switchToDispatchModal();
    });

    // Handle cleanup when dispatch modal is closed
    $('#dispatch-modal').on('hidden.bs.modal', () => {
        patches.ui.closeDispatchModal();
    });

    // Add a unit to the list when the user clicks Add Unit
    $('#js-dispatch-add').on('click', () => {
        const id = $('#dispatch-resource').val();
        patches.ui.addDispatchResource(id);
    });

    // Remove a unit from the dispatch list when a Remove link is clicked
    $(document).on('click', '.dispatch-resource-cancel', evt => {
        evt.preventDefault();
        const id = $(evt.target).data('resource-id');
        patches.ui.removeDispatchResource(id);
    });

    // Dispatch resources when the Dispatch button is clicked
    $('#js-dispatch-selected').on('click', () => {
        patches.ui.dispatchSelected();
    });

    // Cancel dispatch when a Cancel Dispatch link is clicked
    $(document).on('click', '.resource-cancel', evt => {
        const resourceId = $(evt.target).data('resource-id');
        patches.ui.cancelDispatch(resourceId);
    });

    // Update status and UI when the next-status button is clicked
    $(document).on('click', '.js-resource-next-status', async evt => {
        const $resource = $(evt.target).parents('.incident-resource');
        const nextStatusId = parseInt($(evt.target).data('nextStatusId'), 10);
        const resourceId = $resource.data('resource-id');
        await patches.persist.updateResourceStatus(resourceId, nextStatusId);

        const status = patches.statuses.filter(s => s.id === nextStatusId)[0];
        const newNext = patches.getNextStatus(status.name);
        $resource.find('.js-resource-status').text(status.name);
        $resource.find('.js-resource-next-status').text(newNext.name).data('nextStatusId', newNext.id);

        $resource.effect('highlight', {color: '#28a745'}, 500);
    });

    $(document).on('click', '.js-resource-update-status', async evt => {
        $(evt.target).parent().parent().slideToggle(200);
        const $resource = $(evt.target).parents('.incident-resource');
        const nextStatusId = parseInt($(evt.target).data('status-id'), 10);
        const resourceId = $resource.data('resource-id');
        await patches.persist.updateResourceStatus(resourceId, nextStatusId);

        const status = patches.statuses.filter(s => s.id === nextStatusId)[0];
        const newNext = patches.getNextStatus(status.name);
        $resource.find('.js-resource-status').text(status.name);
        $resource.find('.js-resource-next-status').text(newNext.name).data('nextStatusId', newNext.id);

        $resource.effect('highlight', {color: '#28a745'}, 500);
    });

    // Expand status options lists for Change Status option
    $(document).on('click', '.js-resource-change-status', async evt => {
        $(evt.target).parent().siblings('ul').slideToggle(200);
    });

    // Handle incident closure
    $('#js-close-incident').on('click', async () => {
        const incidentId = parseInt($('#incident-modal').data('incidentId'));
        await patches.persist.closeIncident(incidentId);
        const point = patches.points.filter(p => p.id === incidentId)[0];
        patches.points.splice(patches.points.indexOf(point));
        point.marker.remove();
        patches.ui.closeIncidentModal();
    });

    // Setup and open edit modal
    $('.js-edit-incident').on('click', async () => {
        const incidentId = $('#incident-modal').data('incidentId');
        const incidentDetails = await patches.persist.getIncident(incidentId);
        patches.ui.closeIncidentModal();
        const $modal = $('#edit-incident-modal');
        const $form = $modal.find('form');

        $form.find('#edit-incident-id').val(incidentId);
        $form.find('#edit-incident-priority').val(incidentDetails.priority).trigger('change');
        $form.find('#edit-incident-description').val(incidentDetails.description);

        $modal.modal('show');
    });
});