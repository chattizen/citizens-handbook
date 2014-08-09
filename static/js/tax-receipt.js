(function($, window, document, console, Mustache){
    "use strict";

    var
    main                =   $('#main'),
    receipt             =   $('#receipt'),
    calculator          =   $('#calculator'),
    zipInput            =   $('#id_zip'),
    zipLi               =   zipInput.closest('.field'),
    zip                 =   zipInput.val(),
    zipRegex            =   /^[\d]{5}(-[\d]{4})?$/i,
    step2               =   $('<li class="field" data-step="2"><p class="help-block">Please verify your city.</p><label for="id_city">City</label><a href="#" class="btn" tabindex="3">Next</a></li>'),
    citySelect          =   $('<select name="city" id="id_city" tabindex="2"/>'),
    city                =   null,
    step3               =   calculator.find('[data-step="3"]'),
    step4               =   calculator.find('[data-step="4"]'),
    localData           =   {},
    propertyValueInput  =   $('#id_property-value'),
    propertyValue       =   propertyValueInput.val(),
    cityTaxesInput      =   $('#id_city-taxes'),
    cityTaxes           =   cityTaxesInput.val(),
    countyTaxesInput    =   $('#id_county-taxes'),
    countyTaxes         =   countyTaxesInput.val(),
    receiptTemplate     =   $('#template').text(),
    inited              =   0,
    params              =   {};

    $.getJSON(
        '/api/tax-receipt-data.json'
    ).done(function(data) {
        localData   =   data;
        init();
    }).fail(function() {
        calculator.hide();
        main.append('<p><strong>There was an error getting the tax data.</strong></p>');
    });

    function intcomma(x) {
       return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "[").replace(/[\]]/, "]");
        if(!params[name]) {
            var
            regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            params[name] = results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
        return params[name];
    }

    function init() {
        step2.find('label').after(citySelect);
        step3.first().before(step2);

        window.location.hash    =   '';

        for (var i = localData.municipalities.length - 1; i >= 0; i--) {
            citySelect.prepend('<option value="' + localData.municipalities[i] + '">' + localData.municipalities[i] + '</option>');
        }


        calculator.find(':input[name]').each(function() {
            var
            input   =   $(this);
            if(!input.val() && getParameterByName(input.attr('name'))) {
                input.val(getParameterByName(input.attr('name')));
            }
        });

        if(zipInput.val()) {
            validateZip();
        }
        if(getParameterByName('city')) {
            citySelect.val(getParameterByName('city'));
            city    =   getParameterByName('city');
            step2.attr('data-available', 'true');
            validateCity(null, 1);
        }
        if(getParameterByName('property-value')) {
            validateNumericInputs({'target': propertyValueInput[0]});
        }
        if(getParameterByName('city-taxes')) {
            validateNumericInputs({'target': cityTaxesInput[0]});
        }
        if(getParameterByName('county-taxes')) {
            validateNumericInputs({'target': countyTaxesInput[0]});
        }
    }

    function zipapicallback(data) {
        if(data.region && data.region.abbr && data.region.abbr === localData.county.state) {
            // we know we're in the right state at least
            citySelect.val(data.locality);
            step2.attr('data-available', 'true');
            if(data.locality in localData.cities) {
                zipLi.addClass('has-success');
                if(data.localities && data.localities.length === 1) {
                    step2.find('.btn').click();
                } else {
                    step2.find('.btn')[0].focus();
                }
            } else {
                zipLi.addClass('has-warning').append('<p class="alert alert-warning">We do not have tax data for your city. You can still see your county tax bill.</p>');
            }
        } else {
            zipLi.addClass('has-error').append('<p class="alert alert-danger">This tool only works in ' + localData.county.name + '&nbsp;County, ' + localData.county.state + '.</p>');
        }
    }
    window.zipapicallback = zipapicallback;

    function validateZip() {
        zip     =   zipInput[0].value.substr(0,5);
        zipLi.add(step2).removeClass('has-error has-warning has-success').children('.alert').remove();
        step2.add(step3).add(step4).removeAttr('data-available');
        receipt.empty();
        if(zipRegex.test(zip)) {
            if($.inArray(zip, localData.validZips) === -1) {
                zipLi.addClass('has-error').append('<p class="alert alert-danger">This tool only works in ' + localData.county.name + '&nbsp;County, ' + localData.county.state + '.</p>');
            } else {
                if(getParameterByName('city')) {
                    step2.attr('data-available', 'true');
                    citySelect.val(getParameterByName('city'));
                    if(getParameterByName('city') in localData.cities) {
                        zipLi.addClass('has-success');
                        step2.find('.btn')[0].focus();
                    } else {
                        zipLi.addClass('has-warning').append('<p class="alert alert-warning">We do not have tax data for your city. You can still see your county tax bill.</p>');
                    }
                } else {
                    $.ajax({
                        url:             '//s3.amazonaws.com/zips.dryan.io/' + zip + '.json',
                        cache:           true,
                        dataType:        'json',
                        success:          zipapicallback
                    });
                }
            }
        } else if(zip.length >= 5) {
            zipLi.addClass('has-error').append('<p class="alert alert-danger">This does not appear to be a valid ZIP&nbsp;Code.</p>');
        }
    }
    zipInput.on('keyup', validateZip);
    if(zipInput.val()) {
        validateZip();
    }

    function compareItems(a, b) {
        if(a.rate < b.rate) {
            return 1;
        }
        if(a.rate > b.rate) {
            return -1;
        }
        return 0;
    }

    function calculateItems(items) {
        if(!propertyValue) {
            return [];
        }
        var
        i       =   items.length,
        total   =   0;
        while(i--) {
            total   +=  items[i].rate;
        }
        items   =   items.sort(compareItems);
        i       =   items.length;
        while(i--) {
            var
            item                        =   items[i];
            item.old_percentage         =   item.percentage || 0;
            item.amount                 =   intcomma((item.rate * propertyValue).toFixed(2));
            item.percentage             =   (item.rate / total) * 100;
            item.percentage_formatted   =   item.percentage.toFixed(2);
            item.index                  =   (i % 6) + 1;
        }
        return items;
    }

    function printReceipt(e, noAnimate) {
        if(e && e.type && e.type === "submit") {
            e.preventDefault();
            e.stopPropagation();
            window.location.hash    =   'receipt';
        }
        propertyValue       =   (parseFloat(propertyValueInput.val()) || 0) * 0.25;
        cityTaxes           =   cityTaxesInput.val();
        countyTaxes         =   countyTaxesInput.val();
        if(!city) { return; }
        if(!main.is('.calculated')) {
            if(noAnimate) {
                main.addClass('calculated');
            } else {
                main.addClass('animate');
                setTimeout(function() {
                    main.addClass('calculated');
                }, 1);
                setTimeout(function() {
                    main.removeClass('animate');
                }, 700);
            }
        }
        window.console.debug(
            {
                "city": {
                    "name": city,
                    "rate": (localData.cities[city].rate * 100).toFixed(2),
                    "items": calculateItems(localData.cities[city].items || [])
                },
                "county": {
                    "name": localData.county.name,
                    "rate": (localData.county.rate * 100).toFixed(2),
                    "items": calculateItems(localData.county.items || [])
                }
            }
        );
        receipt.html(
            Mustache.render(
                receiptTemplate,
                {
                    "city": {
                        "name": city,
                        "rate": (localData.cities[city].rate * 100).toFixed(2),
                        "items": calculateItems(localData.cities[city].items || [])
                    },
                    "county": {
                        "name": localData.county.name,
                        "rate": (localData.county.rate * 100).toFixed(2),
                        "items": calculateItems(localData.county.items || [])
                    }
                }
            )
        );
        receipt.find('[data-percentage]').each(function() {
            var
            item    =   $(this);
            item.css('width', item.data('percentage'));
        });
    }

    function validateCity(e, noAnimate) {
        if(e && e.type && e.type === "click") {
            e.preventDefault();
        }
        city    =   citySelect.val();
        if(city in localData.cities) {
            step3.attr('data-available', 'true');
        } else {
            step3.filter(':not(:has(#id_city-taxes))').attr('data-available', 'true');
        }
        step2.addClass('has-success');
        propertyValueInput[0].focus();
        printReceipt(null, noAnimate);
    }
    citySelect.on('change', validateCity);
    step2.on('click', '.btn', validateCity);

    function validateNumericInputs(e) {
        try {
            var
            input   =   $(e.target),
            amount  =   parseInt(input.val().replace(/[^\d]+/g, ''), 10);
            input.val(amount);
            try {
                var
                cursor  =   e.target.selectionStart;
                e.target.selectionStart =   cursor;
                e.target.selectionEnd   =   cursor;
            } catch(err) {}
            if(e.type && e.type === 'keyup') {
                input.data('manual-input', true);
            }
            switch(input.attr('id')) {
                case 'id_property-value':
                    propertyValue   =   amount;
                    if(!cityTaxesInput.data('manual-input') && city in localData.cities) {
                        cityTaxes   =   Math.round(amount * localData.cities[city].rate);
                        cityTaxesInput.val(cityTaxes);
                    }
                    if(!countyTaxesInput.data('manual-input')) {
                        countyTaxes =   Math.round(amount * localData.county.rate);
                        countyTaxesInput.val(countyTaxes);
                    }
                    break;
                case 'id_city-taxes':
                    cityTaxes       =   amount;
                    if(!propertyValueInput.data('manual-input') && city in localData.cities) {
                        propertyValue   =   Math.round((amount / (localData.cities[city].rate * 100)) * 100);
                        propertyValueInput.val(propertyValue);
                    }
                    if(!countyTaxesInput.data('manual-input')) {
                        countyTaxes     =   Math.round(localData.county.rate * (propertyValue ? propertyValue : 0));
                        countyTaxesInput.val(countyTaxes);
                    }
                    break;
                case 'id_county-taxes':
                    countyTaxes     =   amount;
                    break;
            }
        } catch(error) { window.console.error(error); }
        printReceipt();
    }

    calculator.on('keyup', '#id_property-value,#id_city-taxes,#id_county-taxes', validateNumericInputs);

    calculator.on('submit', printReceipt);

    calculator.on('focus', '.input-group :input', function() {
        $(this).closest('.input-group').addClass('focus');
    });
    calculator.on('blur', '.input-group :input', function() {
        $(this).closest('.input-group').removeClass('focus');
    });

})(jQuery, window, document, window.console, window.Mustache);