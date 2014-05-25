/*jshint loopfunc: true */
window.chattizen    =   window.chattizen || {};
var chattizen       =   window.chattizen;

(function($, Division, Mustache) {
    "use strict";

    $.support.cors  =   true;

    var
    form        =   $('#representatives'),
    button      =   form.find('button'),
    address     =   $('#id_street_address'),
    city        =   $('#id_city'),
    zip         =   $('#id_zip'),
    results     =   $('<div id="results"/>').insertAfter(form),
    templates   =   {
        division:   '{{#.}}' +
                    '<div class="ocd-division">' +
                        '<h2>{{ name }}</h2>' +
                        '{{#officials}}' +
                        '<div class="official vcard">' +
                            '{{#photoUrl}}<figure class="photo"><img src="//images.dryan.io/?image={{ photoUrl }}&amp;width=180&amp;height=180&amp;strategy=portrait&amp;retina=' + (window.devicePixelRatio > 1 ? 'true' : 'false') + '" alt="{{ name }}" width="180"></figure>{{/photoUrl}}' +
                            '<div class="info">' +
                                '<h3 class="fn">{{ name }}</h3>' +
                                '{{#party}}<p class="party">{{ party }}</p>{{/party}}' +
                                '{{#address}}' +
                                '<p class="adr">' +
                                    '{{#line1}}<span class="street-address">{{ line1 }}</span><br>{{/line1}}' +
                                    '{{#city}}<span class="locality">{{ city }}</span>{{#state}}, {{/state}}{{/city}}' +
                                    '{{#state}}<span class="region">{{ state }}</span>{{/state}}' +
                                    '{{#zip}} <span class="postal-code">{{ zip }}</span>{{/zip}}' +
                                '</p>' +
                                '{{/address}}' +
                                '{{#phones}}' +
                                '<p class="tel">{{ . }}</p>' +
                                '{{/phones}}' +
                                '{{#urls}}' +
                                '<p class="url"><a href="{{ . }}">{{ . }}</a></p>' +
                                '{{/urls}}' +
                                '{{#emails}}' +
                                '<p class="email"><a href="mailto:{{ . }}">{{ . }}</a></p>' +
                                '{{/emails}}' +
                                '{{#channels.length}}' +
                                '<p class="social">' +
                                    '{{#channels}}' +
                                    '{{{ . }}}' +
                                    '{{/channels}}' +
                                '</p>' +
                                '{{/channels.length}}' +
                            '</div>' +
                        '</div>' +
                        '{{/officials}}' +
                    '</div>' +
                    '{{/.}}',
        results:    '{{#results}}{{> division}}{{/results}}'
    };


    $.getJSON(
        'http://zips.dryan.io/locate.json'
    ).done(function(data) {
        if(!city.val()) {
            city.val(data.locality || '');
        }
        if(!zip.val()) {
            zip.val(data.postal_code || '');
        }
    });

    form.on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        button.blur();
        $.ajax({
            type:           'POST',
            url:            'https://www.googleapis.com/civicinfo/us_v1/representatives/lookup?key=' + chattizen.apiKeys.google,
            data:           window.JSON.stringify({"address": [address.val(), city.val(), 'TN', zip.val()].join(' ')}),
            contentType:    'application/json; charset=utf-8',
            dataType:       'json'
        }).done(function(data) {
            if(data.status === 'success') {
                var
                officials   =   {
                    'us_senate':    null,
                    'us_house':     null,
                    'governor':     null,
                    'state_senate': null,
                    'state_house':  null,
                    'county':       [],
                    'city':         []
                };
                for(var ocdid in data.divisions) {
                    var division        =   new Division(ocdid, data.divisions[ocdid]);
                    division.findOffices(data.offices).findOfficials(data.officials);
                    switch(division.scope) {
                        case 'statewide':
                            $.each(division.offices || [], function(index, office) {
                                if(office.name === 'United States Senate') {
                                    officials.us_senate     =   [office];
                                } else if(office.name === 'Governor') {
                                    officials.governor      =   [office];
                                }
                            });
                            break;
                        case 'congressional':
                            officials.us_house  =   division.offices || [];
                            break;
                        case 'countywide':
                            officials.county    =   officials.county.concat(division.offices || []);
                            break;
                        case 'countyCouncil':
                            if(division.offices && division.offices.length) {
                                officials.county.shift(division.offices[0]);
                            }
                            break;
                        case 'citywide':
                            officials.city  =   officials.city.concat(division.offices || []);
                            break;
                        case 'cityCouncil':
                            if(division.offices && division.offices.length) {
                                officials.city.push(division.offices[0]);
                            }
                            break;
                        case 'stateLower':
                            officials.state_house   =   division.offices || [];
                            break;
                        case 'stateUpper':
                            officials.state_senate  =   division.offices || [];
                            break;
                    }
                }
                window.console.debug(officials);
                results.html(Mustache.render(templates.results, {'results': [officials.us_senate, officials.us_house, officials.governor, officials.state_senate, officials.state_house, officials.county, officials.city]}, {division: templates.division}));
            } else {
                results.html('<p>There was an issue looking up your information</p>');
            }
        });
    });

    address.val('3916 Memphis Dr.');
    city.val('Chattanooga');
    zip.val('37415');
    form.submit();

})(window.jQuery, window.OCDDivision, window.Mustache);