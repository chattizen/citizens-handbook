/*jshint loopfunc: true */
window.chattizen    =   window.chattizen || {};
var chattizen       =   window.chattizen;

(function($, Modernizr) {
    "use strict";

    var
    html            =   $('html'),
    showNav         =   $('#show-nav'),
    maps            =   $('.map'),
    corejs          =   $('#corejs');

    chattizen.apiKeys   =   {
        'google':       corejs.data('google-api-key'),
        'sunlight':     corejs.data('sunlight-api-key')
    };

    showNav.on('click', function() {
        html.toggleClass('show-nav');
        showNav.blur();
    });

    Modernizr.load({
        test:       maps.length,
        yep:        ['/bower_components/leaflet/dist/leaflet.js', '/bower_components/leaflet/dist/leaflet.css'],
        callback:   {
            'leaflet.js':   function() {
                maps.each(function() {
                    var
                    container   =   $(this),
                    map         =   window.L.map(container[0], {
                                        center: [35.0456, -85.267],
                                        zoom: 11,
                                        zoomAnimation: false,
                                        fadeAnimation: false
                                    });
                    window.L.tileLayer('http://{s}.tiles.mapbox.com/v3/dryan.ib14dmok/{z}/{x}/{y}.png').addTo(map);
                    if(container.data('boundaries')) {
                        $.getJSON(
                            container.data('boundaries')
                        ).done(function(data) {
                            var
                            geoJson = window.L.geoJson(window.topojson.mesh(data)).addTo(map);
                            map.fitBounds(geoJson.getBounds());
                        }).fail(function() {
                            container.remove();
                        });
                    } else {
                        $.getJSON(
                            'http://nominatim.openstreetmap.org/search?json_callback=?',
                            {
                                street:     container.data('street-address'),
                                city:       container.data('locality'),
                                state:      container.data('region'),
                                postalcode: container.data('postal-code'),
                                country:    (container.data('country') || 'US').toLowerCase(),
                                email:      'daniel@openchattanooga.com',
                                format:     'jsonv2'
                            }                        
                        ).done(function(data) {
                            if($.isArray(data)) {
                                data    =   data.shift();
                            }
                            if(data.lat && data.lon) {
                                map.setView([data.lat, data.lon], 15);
                                map.attributionControl.addAttribution(data.licence);
                                window.L.marker([data.lat, data.lon], {
                                    clickable:  false,
                                    title:      container.data('name') || ''
                                }).addTo(map);
                            } else {
                                container.remove();
                            }
                        }).fail(function() {
                            container.remove();
                        });
                    }
                });
            }
        }
    });

})(window.jQuery, window.Modernizr);