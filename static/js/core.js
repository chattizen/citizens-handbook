/*jshint loopfunc: true */
window.chattizen    =   window.chattizen || {};
var chattizen       =   window.chattizen;

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisArg */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}

(function($, Modernizr) {
    "use strict";

    var
    html            =   $('html'),
    showNav         =   $('#show-nav'),
    maps            =   $('.map'),
    corejs          =   $('#corejs'),
    division        =   $('#division'),
    sidebar         =   $('#sb'),
    main            =   $('#main'),
    noop            =   function() {},
    protos          =   {
        'li':   $('<li />'),
        'a':    $('<a />')
    };

    chattizen.apiKeys   =   {
        'google':       corejs.data('google-api-key'),
        'sunlight':     corejs.data('sunlight-api-key')
    };

    chattizen.utils     =   {
        'slugify':  function(text) {
            return String(text).toLowerCase().replace(/ +/g, '-').replace(/[^\w-]+/g, '');
        }
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

    function ocdAPICall(ocd_id, callback, errCallback) {
        $.getJSON(
            ['https://api.opencivicdata.org/ocd-division', ocd_id, '?apikey=', chattizen.apiKeys.sunlight, '&callback=?'].join('')
        ).done(callback || noop).fail(errCallback || noop);
    }

    function tableOfContents() {
        var
        headers     =   main.find(':header'),
        i           =   headers.length,
        toc         =   $('<nav id="toc" role="navigation" class="section" />'),
        tocList     =   $('<ul />').appendTo(toc);
        if(headers.length && sidebar.length) {
            sidebar.prepend(toc);
            toc.prepend('<p class="label">On this page</p>');
            while(i--) {
                var
                header  =   $(headers[i]),
                item    =   protos.li.clone(),
                link    =   protos.a.clone();
                if(!header.attr('id')) {
                    header.attr('id', chattizen.utils.slugify(header.text()));
                }
                link.attr({title: header.text(), href: '#' + header.attr('id')}).text(header.text());
                item.append(link).prependTo(tocList);
            }
        }
    }
    tableOfContents();

})(window.jQuery, window.Modernizr);