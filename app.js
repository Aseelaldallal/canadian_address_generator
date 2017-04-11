'use strict'

/***************************************************/
/********************* SETUP ***********************/
/***************************************************/

var express         = require("express"),
    app             = express(), 
    fs              = require('fs'),
    GooglePlaces    = require('node-googleplaces');

// API KEY
const places = new GooglePlaces('API KEY');

/***************************************************/
/******************* THE CODE **********************/
/***************************************************/

var addresses = new Array(); 
var file = 'addresses.txt';

generateCanadianLocation();
setTimeout(function() { 
     var myJSON = JSON.stringify(addresses, null, 2);
     record(myJSON);
}, 15000);
    
/***************************************************/
/******************* FUNCTIONS *********************/
/***************************************************/

// Generate Canadian Location
function generateCanadianLocation() {
    var lat = 51.37048922880747;
    var lng = -102.87505347714841;
    for(var i=0; i<32; i++ ) {
        var lng = lng + 1;
        var lat = lat - 1;
        var loc = lat + ", " + lng;
        const nbsParams = {
    	    location: loc,
    	    radius: 20000
        }
        places.nearbySearch(nbsParams, function(nbsErr, nbsResults) {
            if(nbsResults) {
                var numResults = nbsResults.body.results.length;
            	if(nbsErr) { console.log(nbsErr) }
                for(var i=0; i<numResults; i++) {
                	recordPlaceDetails(nbsResults.body.results[i]);
                }
            }
        });
    }
}


function recordPlaceDetails(place) {
	var params = { place_id: place.place_id };
	places.details(params, function(error, place) {
		if(error) { console.log(error) } 
		extractPlaceComponents(place);
	});
}

function extractPlaceComponents(place) {
	var details = new Array(); 
    var componentForm = {
        street_number: 'short_name',
        route: 'short_name', // Address = street number + route
        locality: 'long_name', // City
        administrative_area_level_1: 'short_name', // Province
        postal_code: 'short_name',
        subpremise: 'long_name', // Unit Number
        country: 'short_name'
    };   
    if(place && place.body && place.body.result.name) {
        details['name'] = place.body.result.name;
    }
    for (var i = 0; i < place.body.result.address_components.length; i++) {
        var addressType = place.body.result.address_components[i].types[0];
        if (componentForm[addressType]) {
            var val = place.body.result.address_components[i][componentForm[addressType]];
            details[addressType] = val;
        }
    }
    var lat = place.body.result.geometry.location.lat;
    var long = place.body.result.geometry.location.lng;
    var latlong = lat + "," + long; 
    details['location'] = latlong;

    recordJSON(details);
}

function recordJSON(details) {
	if( details.street_number != undefined &&  
        details.route != undefined &&  
        details.locality != undefined &&  
        details.administrative_area_level_1 != undefined &&  
        details.country == "CA" &&
        details.postal_code != undefined 
    ) {
    	var obj = {
    		"name": details.name,
          	"unit": details.subpremise,
          	"address": details.street_number + " " + details.route,
          	"city": details.locality,
          	"province": details.administrative_area_level_1,
          	"postalCode": details.postal_code,
          	"coordinates": details.location
    	}
		addresses.push(obj);
    } // End if
}


function record(string) {
    fs.appendFile(file, string, function (jerr) {
  			if(jerr) { console.log(jerr) }
    }); 
}



/***************************************************/
/***************** SERVER LISTEN *******************/
/***************************************************/

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server started");
});
