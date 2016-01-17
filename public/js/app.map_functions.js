function format(s){
    var res = "<p>";
    if(s){
        var lines = s.split("\n");
        $.each(lines, function(key,value){
            if (value)
                res += value + "<br>";
            else
                res += "</p><p>";
        });
    }
    return res + "</p>";
}

function removeFromMap(marker){
    marker.setMap(null);
}

function addMarker(marker, category){

    var contentString = "<div class=\"marker-details\">";
    contentString += "<div class=\"marker-title\"><h3>" + marker.title + "</h3></div>";
    contentString += "<div class=\"marker-subtitle\"><h4>" + marker.subtitle + "</h4></div>";
    contentString += "<div class=\"marker-details\">";
    contentString += "<div class=\"marker-image\"><img src=\"" + marker.image + "\" /></div>";
    contentString += "<div class=\"marker-content\">" + format(marker.description) ;
    contentString += "<p><a href=\"" + marker.lien + "\">Voir la fiche</a></p></div>";
    contentString += "</div>";
    contentString += "<div class=\"marker-article\"></div>";
    contentString += "</div>";

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    
    var newMarker;
    if (category.name == "Other"){
        newMarker = new google.maps.Marker({
            position: JSON.parse(marker.position),
            map: map,
            title: marker.title
        });
    }
    else{
        newMarker = new google.maps.Marker({
            position: JSON.parse(marker.position),
            map: map,
            title: marker.title,
            icon: category.icon
        });
    }
    
    newMarker.addListener('click', function() {
        closeAllInfoWindows();
        infowindow.open(map, newMarker);
    });
    markers_pointers.push({id: marker._id, marker: newMarker});
    infoWindows.push(infowindow);
    
    var markers_div = $("#markers");
    var marker_vignette = "<div class=\"marker-vignette\" id=\"marker-vignette-"+marker._id+"\">";
    marker_vignette += "<div class=\"marker-v-image\"><img src=\"" + marker.image + "\" /></div>";
    marker_vignette += "<div class=\"marker-v-title\"><h5>"+ marker.title+"</h5></div>";
    marker_vignette += "<div class=\"marker-delete\" onclick=\"deleteMarker('"+marker._id+"')\"><img src=\"http://uxrepo.com/static/icon-sets/ionicons/svg/ios7-trash-outline.svg\" /></div>";
    marker_vignette += "</div>";
    markers_div.append(marker_vignette);
}

function addAllMarkers(categories){
    for(var i=0; i<categories.length; i++){
        for(var j=0; j<categories[i].markers.length; j++){
            addMarker(categories[i].markers[j], categories[i]);    
        }
    }
}

function closeAllInfoWindows(){
    for(var i=0; i<infoWindows.length; i++){
        infoWindows[i].close(); 
    }
}
