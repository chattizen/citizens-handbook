/*jshint loopfunc: true */
(function() {
    "use strict";

    function parseIdentifier(identifier) {
        identifier  =   identifier.split('/');
        var
        i       =   identifier.length,
        output  =   {};
        while(i--) {
            var
            pieces  =   identifier[i].split(':');
            if(pieces.length === 2) {
                output[pieces[0]]   =   pieces[1];
            }
        }
        return output;
    }

    // http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
    function toTitleCase(str) {
        str     =   str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        return str;
    }

    function OCDDivision(identifier, data) {
        this.id     =   identifier;
        var
        key;

        for(key in data) {
            this[key]   =   data[key];
        }

        identifier  =   parseIdentifier(identifier);
        for(key in identifier) {
            this[key]   =   identifier[key];
        }

        return this;
    }

    OCDDivision.prototype.findOffices   =   function(offices) {
        if(!this.officeIds) {
            return this;
        }

        var
        i               =   this.officeIds.length;
        this.offices    =   this.offices || [];

        while(i--) {
            var
            officeId    =   this.officeIds[i];
            if(officeId in offices) {
                this.offices.push(offices[officeId]);
            }
        }

        return this;
    };

    OCDDivision.prototype.findOfficials =   function(officials) {
        if(!this.offices) {
            return this;
        }

        var
        i               =   this.offices.length;

        while(i--) {
            var
            office          =   this.offices[i],
            x               =   office.officialIds.length;

            office.officials    =   office.officials || [];
            while(x--) {
                var
                officialId  =   office.officialIds[x];
                if(officialId in officials) {
                    officials[officialId].party     =   officials[officialId].party === 'Unknown' ? null : officials[officialId].party;
                    if(officials[officialId].address && officials[officialId].address.length) {
                        var
                        y   =   officials[officialId].address.length;
                        while(y--) {
                            officials[officialId].address[y].city   =   toTitleCase(officials[officialId].address[y].city);
                        }
                    }
                    OCDDivision.channelsToLinks(officials[officialId]);
                    if(officials[officialId].photoUrl) {
                        officials[officialId].photoUrl  =   encodeURIComponent(officials[officialId].photoUrl);
                    }
                    office.officials.push(officials[officialId]);
                }
            }
        }

        return this;
    };

    OCDDivision.channelsToLinks   =   function(official) {
        // this is a Class method
        var
        y           =   official.channels ? official.channels.length : 0;
        while(y--) {
            var
            channel     =   official.channels[y];
            switch(channel.type.toLowerCase()) {
                case 'facebook':
                    channel     =   '<a href="https://www.facebook.com/' + channel.id + '" title="Facebook" class="fa fa-facebook"></a>';
                    break;
                case 'twitter':
                    channel     =   '<a href="https://twitter.com/' + channel.id + '" title="Twitter" class="fa fa-twitter"></a>';
                    break;
                case 'youtube':
                    channel     =   '<a href="https://www.youtube.com/user/' + channel.id + '" title="Youtube" class="fa fa-youtube-play"></a>';
                    break;
                case 'vimeo':
                    channel     =   '<a href="http://vimeo.com/' + channel.id + '" title="Vimeo" class="fa fa-vimeo-square"></a>';
                    break;
                default:
                    channel     =   null;
                    break;
            }
            if(channel) {
                official.channels[y]   =   channel;
            } else {
                delete official.channels[y];
            }
        }
    };

    window.OCDDivision  =   OCDDivision;

})();