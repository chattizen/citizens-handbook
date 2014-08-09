(function(g) {
    "use strict";
    
    g.load('gdata', '1');

    var
    body    =   document.body,
    cal     =   document.getElementById('calendar'),
    feed    =   'https://www.google.com/calendar/feeds/tfm1lo8jl8kvh2rhr9kf3bl2tk@group.calendar.google.com/public/full',
    service,
    months  =   [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    currentStart,
    tmpl    =   document.getElementById('template').innerHTML;

    function autolink(text) {
        // http://jsfiddle.net/kachibito/hEgvc/1/light/
        return text.replace(/((http|https|ftp):\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g,"<a href='$1'>$1</a>");
    }

    function formatTime(date) {
        var
        output  =   [];
        output.push((date.getHours() % 12) || 12);
        output.push(':');
        output.push(('0' + date.getMinutes()).slice(-2));
        output.push(date.getHours() > 11 ? ' p.m.' : ' a.m.');
        return output.join('');
    }

    function sortEvents(a, b) {
        if(a.start < b.start) {
            return -1;
        } else if(a.start > b.start) {
            return 1;
        } else {
            return 0;
        }
    }

    function displayEvents(data) {
        var
        events  =   [],
        feed    =   data.feed.getEntries(),
        i       =   feed.length;

        while(i--) {
            var
            evnt    =   feed[i],
            j       =   evnt.gd$when.length;
            while(j--) {
                var
                obj     =   {};
                obj.title   =   evnt.getTitle().getText();
                obj.content =   autolink(evnt.getContent().getText());
                obj.start   =   new Date(evnt.gd$when[j].startTime);
                obj.day     =   obj.start.getDate();
                obj.time    =   formatTime(obj.start);
                try {
                    obj.address =   evnt.gd$where[0].valueString.replace(', United States', '');
                } catch(e) {}
                events.unshift(obj);
            }

        }
        events.sort(sortEvents);
        cal.innerHTML   =   window.Mustache.render(tmpl, {
            'month':    [months[currentStart.getMonth()], currentStart.getFullYear()].join(' '),
            'events':   events
        });
        body.classList.remove('loading');
    }

    function errorHandler(error) {
        window.console.error(error);
    }

    function getFirstOfMonth(month, year) {
        var
        start       =   new Date();
        if(month) {
            start.setMonth(month);
        }
        if(year) {
            start.setYear(year);
        }
        start.setDate(1);
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start.setMilliseconds(0);
        return start;
    }

    function getEndOfMonth(start) {
        var
        end         =   new Date(start.getTime());
        end.setMonth(start.getMonth() + 1);
        end         =   new Date(end - (24 * 60 * 60 * 1000));
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);
        return end;
    }

    function hashHandler() {
        var
        hash    =   window.location.hash.replace(/^#/, '');
        if(/^[\d]{4}-[\d]{2}$/.exec(hash)) {
            hash    =   hash.split('-');
            var
            year    =   parseInt(hash[0], 10),
            month   =   parseInt(hash[1], 10) - 1,
            start   =   new Date();
            start.setYear(year);
            start.setMonth(month);
            start.setDate(1);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            start.setMilliseconds(0);
            displayEventsFor(start);
        }
    }

    window.addEventListener('hashchange', hashHandler);

    function setHash(start) {
        if(!start) { return; }
        window.location.hash    =   [start.getFullYear(), ('0' + (start.getMonth() + 1)).slice(-2)].join('-');
    }

    function init() {
        service     =   new g.gdata.calendar.CalendarService('chadev-events-1');
        if(/^#?[\d]{4}-[\d]{2}$/.exec(window.location.hash)) {
            hashHandler();
            return;
        }

        setHash(getFirstOfMonth());
    }

    function displayEventsFor(start, end) {
        if(!service || !start) { return; }

        if(!end) {
            end     =   getEndOfMonth(start);
        }
        var
        query       =   new g.gdata.calendar.CalendarEventQuery(feed);

        query.setMinimumStartTime(start.toISOString());
        query.setMaximumStartTime(end.toISOString());

        cal.innerHTML   =   '';
        body.classList.add('loading');
        currentStart    =   start;

        service.getEventsFeed(query, displayEvents, errorHandler);
    }

    function clickHandler(e) {
        var
        start   =   new Date(currentStart.getTime());
        if(e.srcElement && e.srcElement.className.indexOf('previous') > -1) {
            e.preventDefault();
            start.setMonth(start.getMonth() - 1);
            setHash(start);
        } else if(e.srcElement && e.srcElement.className.indexOf('next') > -1) {
            e.preventDefault();
            start.setMonth(start.getMonth() + 1);
            setHash(start);
        }
    }

    cal.addEventListener('click', clickHandler);

    g.setOnLoadCallback(init);
})(window.google);
