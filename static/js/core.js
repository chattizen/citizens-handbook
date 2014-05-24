/*jshint loopfunc: true */
window.chattizen    =   window.chattizen || {};
var chattizen       =   window.chattizen;

(function($, Modernizr) {
    "use strict";

    var
    html            =   $('html'),
    showNav         =   $('#show-nav'),
    maps            =   $('.map'),
    corejs          =   $('#corejs'),
    googleAPIKey    =   corejs.data('google-api-key');

    showNav.on('click', function() {
        html.toggleClass('show-nav');
        showNav.blur();
    });

    Modernizr.load({
        test:       maps.length,
        yep:        ['/bower_components/leaflet/dist/leaflet.js', '/bower_components/leaflet/dist/leaflet.css'],
        callback:   {
            'leaflet.js':   function() {
                var
                i   =   maps.length;
                while(i--) {
                    var
                    container   =   $(maps[i]),
                    map         =   window.L.map(maps[i], {
                                        center: [35.0456, -85.267],
                                        zoom: 11,
                                        zoomAnimation: false,
                                        fadeAnimation: false
                                    });
                    window.L.tileLayer('http://{s}.tiles.mapbox.com/v3/dryan.ib14dmok/{z}/{x}/{y}.png').addTo(map);
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
                        window.console.debug(data);
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
            }
        }
    });

})(window.jQuery, window.Modernizr);