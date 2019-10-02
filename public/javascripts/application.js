$(async () => {
    window.patches = window.patches || {};
    Object.assign(window.patches, {
        mapsApiKey: 'AIzaSyDSK-bGNDVkw1SQhIj4QRLw0AwAY79SJaw',
        w3wApiKey: 'V6UK50RA',
        map: L.map('main-map').setView([51.505, -0.09], 12),
        latLngToString: latlng => `${latlng.lat},${latlng.lng}`,
        latLngFromString: str => {
            const splat = str.split(',');
            return L.latLng(parseFloat(splat[0]).toFixed(8), parseFloat(splat[1]).toFixed(8));
        },
        validateForm: el => {
            let valid = true;
            const data = {};
            $(el).find('input, textarea, select').each((i, e) => {
                if (!$(e).val() && $(e).attr('required')) {
                    valid = false;
                    $(e).addClass('border-danger');
                }
                else {
                    $(e).removeClass('border-danger');
                    data[$(e).attr('name')] = $(e).val();
                }
            });
            return {valid, data};
        },
        icons: {
            1: L.icon({
                iconUrl: '/images/marker-red.png',
                iconRetinaUrl: '/images/marker-red.png',
                iconSize: [48, 48],
                iconAnchor: [24, 48],
                popupAnchor: [0, -55],
                tooltipAnchor: [0, -55]
            }),
            2: L.icon({
                iconUrl: '/images/marker-orange.png',
                iconRetinaUrl: '/images/marker-orange.png',
                iconSize: [48, 48],
                iconAnchor: [24, 48],
                popupAnchor: [0, -55],
                tooltipAnchor: [0, -55]
            }),
            3: L.icon({
                iconUrl: '/images/marker-green.png',
                iconRetinaUrl: '/images/marker-green.png',
                iconSize: [48, 48],
                iconAnchor: [24, 48],
                popupAnchor: [0, -55],
                tooltipAnchor: [0, -55]
            })
        },

        points: [],

        statuses: [],
        statusNext: {
            'Clear': 'Assigned En Route',
            'Assigned En Route': 'Assigned On Scene',
            'Assigned On Scene': 'Assigned In Transport',
            'Assigned In Transport': 'Handover',
            'Handover': 'Clear',
            'Break': 'Clear'
        },
        getNextStatus: status => {
            return patches.statuses.filter(s => s.name === patches.statusNext[status])[0];
        }
    });

    // ==================================

    let activeType = 'streets';
    let activeLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYXJ0b2Zjb2RlIiwiYSI6ImNrMGN6MTRrMjAyZHAzYmxtamc1bnVxdjUifQ.JvnbqTpvAu3xuvz5tjcw6A'
    }).addTo(patches.map);

    $('.map-type').on('click', () => {
        patches.map.removeLayer(activeLayer);
        const newLayer = activeType === 'streets' ? 'satellite' : 'streets';
        activeLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: `mapbox.${newLayer}`,
            accessToken: 'pk.eyJ1IjoiYXJ0b2Zjb2RlIiwiYSI6ImNrMGN6MTRrMjAyZHAzYmxtamc1bnVxdjUifQ.JvnbqTpvAu3xuvz5tjcw6A'
        }).addTo(patches.map);
        activeType = newLayer;
    });

    // ==================================

    const activeIncidents = await patches.persist.getActiveIncidents();
    activeIncidents.forEach(i => {
        patches.ui.createIncidentMarker(i.id, i);
    });

    patches.map.on('click', evt => {
        const gridRef = (() => {try {return new LatLon(evt.latlng.lat, evt.latlng.lng).toOsGrid().toString()} catch (err) {return null}})();
        const gridSpan = !!gridRef ? `<span class="font-weight-bold">${gridRef}</span><br/>` : '';
        const popup = L.popup();
        popup.setLatLng(evt.latlng).setContent(
            `<p class="text-center">${gridSpan}${evt.latlng.lat.toFixed(8)}&deg;N, ${evt.latlng.lng.toFixed(8)}&deg;W</p>
            <a href="#" data-latlng="${patches.latLngToString(evt.latlng)}" class="dispatch">Dispatch</a>`
        ).openOn(patches.map);
    });

    $(document).on('click', 'a.dispatch', evt => {
        evt.preventDefault();
        const latLng = patches.latLngFromString($(evt.target).data('latlng'));
        $('#new-incident-lat').val(latLng.lat);
        $('#new-incident-lng').val(latLng.lng);
        $('#new-incident-modal').modal('show');
    });

    $('.new-incident-submit').on('click', async evt => {
        const $tgt = $(evt.target);
        const $form = $tgt.parents('form');
        const $modal = $tgt.parents('.modal');
        const {valid, data} = patches.validateForm($form);
        if (!valid) {
            $tgt.removeClass('btn-primary').addClass('btn-danger');
            $modal.effect('shake', {direction: 'right', times: 4, distance: 10}, 500);
        }
        else {
            $tgt.find('.new-incident-error').addClass('hide');
            $tgt.removeClass('btn-danger').addClass('btn-primary');
            try {
                const incidentId = await patches.persist.createIncident(data.lat, data.lng, data.priority, data.description);

                patches.ui.createIncidentMarker(incidentId, data);
            }
            catch (err) {
                console.log(err);
                $tgt.find('.new-incident-error').text(err).removeClass('hide');
                $modal.effect('shake', {direction: 'right', times: 4, distance: 10}, 500);
                return;
            }

            patches.map.closePopup();
            $form[0].reset();
            $modal.modal('hide');
        }
    });

    $('.edit-incident-submit').on('click', async evt => {
        const $tgt = $(evt.target);
        const $form = $tgt.parents('form');
        const $modal = $tgt.parents('.modal');
        const {valid, data} = patches.validateForm($form);
        if (!valid) {
            $tgt.removeClass('btn-primary').addClass('btn-danger');
            $modal.effect('shake', {direction: 'right', times: 4, distance: 10}, 500);
        }
        else {
            $tgt.find('.edit-incident-error').addClass('hide');
            $tgt.removeClass('btn-danger').addClass('btn-primary');
            const incidentId = parseInt(data.id, 10);
            try {
                await patches.persist.editIncident(incidentId, {priority: data.priority, description: data.description});
                const point = patches.points.filter(x => x.id === incidentId)[0];
                patches.ui.changeMarkerPriority(point.marker, parseInt(data.priority, 10));
            }
            catch (err) {
                console.log(err);
                $tgt.find('.edit-incident-error').text(err).removeClass('hide');
                $modal.effect('shake', {direction: 'right', times: 4, distance: 10}, 500);
                return;
            }

            patches.map.closePopup();
            $form[0].reset();
            $modal.modal('hide');
            patches.ui.incidentModal(await patches.persist.getIncident(incidentId));
        }
    });

    // ==================================

    // Retrieve and cache statuses and insert into resource status list
    (async () => {
        patches.statuses = await patches.persist.getResourceStatuses();

        const $statusList = $('#incident-resource-template').find('.js-resource-status-list');
        $statusList.hide();
        patches.statuses.forEach(s => {
            $(`<li class="list-group-item"><a href="#" class="js-resource-update-status" data-status-id="${s.id}">${s.name}</a></li>`).appendTo($statusList);
        });
    })();

    // ==================================

    const optionHandlers = {
        street: async search => {
            const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${search}&key=${patches.mapsApiKey}`);
            const data = await resp.json();
            if (data.results && data.results.length >= 1) {
                return {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng};
            }
            else {
                return null;
            }
        },
        w3w: async search => {
            const address = search.replace(/\s/g, '.');
            if (address.split('.').length !== 3) {
                return null;
            }

            try {
                const resp = await fetch(`https://api.what3words.com/v3/convert-to-coordinates?words=${address}&key=${patches.w3wApiKey}`);
                const data = await resp.json();
                return {lat: data.square.southwest.lat, lng: data.square.southwest.lng};
            }
            catch (err) {
                return null;
            }
        },
        osgrid: async search => {
            try {
                const gridRef = OsGridRef.parse(search);
                return gridRef.toLatLon();
            }
            catch (err) {
                // Invalid grid reference, probably
                return null;
            }
        }
    }

    $('.search-option').on('click', async evt => {
        const search = $('.search-bar').val();
        const latlng = await optionHandlers[$(evt.target).data('option')](search);
        if (!latlng) {
            $(evt.target).effect('highlight', {color: '#dc3545'}, 500);
        }
        else {
            $(evt.target).effect('highlight', {color: '#28a745'}, 500);
            patches.map.panTo([latlng.lat, latlng.lng]);
            const gridRef = (() => {try {return new LatLon(latlng.lat, latlng.lng).toOsGrid().toString()} catch (err) {return null}})();
            const gridSpan = !!gridRef ? `<span class="font-weight-bold">${gridRef}</span><br/>` : '';
            const popup = L.popup();
            popup.setLatLng([latlng.lat, latlng.lng]).setContent(
                `<p class="text-center">${gridSpan}${latlng.lat.toFixed(8)}&deg;N, ${latlng.lng.toFixed(8)}&deg;W</p>
                <a href="#" data-latlng="${patches.latLngToString(latlng)}" class="dispatch">Dispatch</a>`
            ).openOn(patches.map);
        }
    });
});

Object.filter = (obj, fn) => {
    const result = {};
    Object.keys(obj).forEach(k => {
        if (fn(k, obj[k])) {
            result[k] = obj[k];
        }
    });
    return result;
}
