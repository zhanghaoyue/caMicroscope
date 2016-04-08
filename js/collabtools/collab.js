viewer.addHandler("animation-finish", function(){
    var zoom = viewer.viewport.getZoom();
    var center = viewer.viewport.getCenter();
    if(TogetherJS.running){
        TogetherJS.send({
            type: "panAndZoom",
            zoom: zoom,
            center: center
        });
    }
});

TogetherJS.hub.on("panAndZoom", function(msg){
    var zoom = msg.zoom;
    var center = msg.center;

    viewer.viewport.panTo(center);
    viewer.viewport.zoomTo(zoom);
});

/*
viewer.addHandler("zoom", function(e){
    console.log("zooming!"); 
    console.log(e);
    if(TogetherJS.running){
        TogetherJS.send({
            type: 'zoom',   
            zoom: e.zoom
        });
    }
});

viewer.addHandler("pan", function(e){
    console.log(e);
    if(TogetherJS.running){
        TogetherJS.send({
            type: 'pan',   
            zoom: e.center
        });
    }
});


TogetherJS.hub.on("pan", function(msg){
    
    //If current zoom is the one recieved: Do nothing
    var currentCenter = viewer.viewport.getCenter();
    if(msg.center.x  == currentCenter.x){
        return;
    }

    console.log(msg);
    //if(!msg.sameUrl){
        console.log("recieved pan");
        viewer.viewport.panTo(msg.center);
    //}
});

TogetherJS.hub.on("zoom", function(msg){
    
    //If current zoom is the one recieved: Do nothing
    var currentZoom = viewer.viewport.getZoom();
    if(msg.zoom == currentZoom){
        return;
    }

    console.log(msg);
    //if(!msg.sameUrl){
        console.log("recieved zoom");
        viewer.viewport.zoomTo(msg.zoom);
    //}
});
*/
