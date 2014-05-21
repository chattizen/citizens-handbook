window.chattizen    =   window.chattizen || {};
var chattizen       =   window.chattizen;

(function($) {
    "use strict";

    var
    html        =   $('html'),
    showNav     =   $('#show-nav');

    showNav.on('click', function() {
        html.toggleClass('show-nav');
        showNav.blur();
    });

})(window.jQuery);