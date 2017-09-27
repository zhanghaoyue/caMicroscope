var hub = new Hub("10.40.55.243:3001");
// add on view and stuff, update state
hub.state = "{\"x\":0.5,\"y\":0.5,\"z\":1}";

function update_position(event) {
  console.log(event);
    var state = JSON.parse(hub.state);
    var pt = new OpenSeadragon.Point(state.x, state.y);
    viewer.viewport.zoomTo(state.z);
    viewer.viewport.panTo(pt, false);
}

function send_position(e) {
    hub.state = JSON.stringify({
        "x": viewer.viewport.getCenter().x,
        "y": viewer.viewport.getCenter().y,
        "z": viewer.viewport.getZoom()
    });
}
viewer.addHandler("zoom", send_position);
viewer.addHandler("pan", send_position);
hub.callback = update_position;
update_position({}); // init spokes
window.alert("Hub id is: " + hub.id);
console.log("Hub id is: " + hub.id);
