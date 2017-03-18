/**
 * Created by amandaghassaei on 3/17/17.
 */

var plane;
var vertices;
var boundary;
var controlPoints;
var cpMeshes;
var mesh;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
var isDragging = false;
var draggingCP = null;
var mouseDown = false;
var highlightedObj;

var profiles = [];

function initDataView(){
    var planeGeo = new THREE.PlaneBufferGeometry(1, 1);
    var planeMat = new THREE.MeshBasicMaterial({color:0xffffff});
    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.visible = false;
    threeView.scene.add(plane);

    threeView.controls.addEventListener('change', updateControlPoints);

     document.addEventListener('mousedown', function(){
        mouseDown = true;
    }, false);

    document.addEventListener('mouseup', function(e){
        isDragging = false;
        if (draggingCP){
            draggingCP = null;
            setHighlightedObj(null);
        }
        mouseDown = false;
    }, false);

    document.addEventListener( 'mousemove', mouseMove, false );
}

function updateBoundary(){
    if (controlPoints === undefined || controlPoints.length == 0) return;
    var interpVertices = getInterpolatedVertices();
    for (var i=0;i<interpVertices.length;i++){
        controlPoints[i].setPosition(interpVertices[i]);
    }
    boundary.geometry.verticesNeedUpdate = true;
}

function getInterpolatedVertices(){
    var lowerProfile = null;
    var upperProfile = null;
    for (var i=0;i<profiles.length;i++){
        if (layerNumber == profiles[i].layerNumber) return profiles[i].vertices;
        if (layerNumber<profiles[i].layerNumber){
            upperProfile = profiles[i];
            if (profiles.length>i+1 && profiles[i+1].layerNumber<layerNumber) lowerProfile = profiles[i+1];
        }
    }

    if (!upperProfile) return profiles[0].vertices;
    if (!lowerProfile) return upperProfile.vertices;

    var interp = [];
    var t = (layerNumber - lowerProfile.layerNumber)/(upperProfile.layerNumber-lowerProfile.layerNumber);
    for (var i=0;i<lowerProfile.vertices.length;i++){
        interp.push((lowerProfile.vertices[i].clone().multiplyScalar(1-t)).add(upperProfile.vertices[i].clone().multiplyScalar(t)));
    }
    return interp;
}

function showData(data) {
    var dataTex = new THREE.DataTexture(data, size[0], size[1], THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTex.magFilter = THREE.NearestFilter; // also check out THREE.LinearFilter just to see the results
    dataTex.needsUpdate = true; // somehow this line is required for this demo to work. I have not figured that out yet.
    plane.material.map = dataTex;
    plane.material.needsUpdate = true;
    plane.visible = true;
    updateBoundary();
    threeView.render();
}

function makeBoundaryGeometry(numPoints){
    numPoints = parseInt(numPoints);
    if (isNaN(numPoints)) numPoints = 6;
    if (numPoints <= 0) numPoints = 6;
    vertices = [];
    controlPoints = [];
    cpMeshes = [];
    profiles = [];
    var geometry = new THREE.Geometry();
    for (var i=0;i<numPoints;i++){
        var theta = i*Math.PI*2/numPoints;
        var cp = new ControlPoint(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 1));
        vertices.push(cp.getPosition());
        controlPoints.push(cp);
        cpMeshes.push(cp.getMesh());
    }
    vertices.push(vertices[0]);

    addProfile();

    geometry.vertices = vertices;
    geometry.dynamic = true;
    var material = new THREE.LineBasicMaterial({
        color: 0xff00ff
    });
    boundary = new THREE.Line(geometry, material);
    threeView.scene.add(boundary);
    threeView.render();
}

function addProfile(){
    //check if profile already exists for this layer
    var index = null;
    for (var i=0;i<profiles.length;i++){
        if (profiles[i].layerNumber == layerNumber) {
            index = i;
            break;
        }
    }

    var profileVertices = [];
    for (var i=0;i<controlPoints.length;i++){
        profileVertices.push(controlPoints[i].getPosition().clone());
    }
    var profile = {
        layerNumber: layerNumber,
        vertices: profileVertices
    };
    if (index !== null) profiles[index] = profile;
    else {
        profiles.push(profile);
        profiles = _.sortBy(profiles, function(profile){ return -profile.layerNumber; });
    }

    renderProfileUI();
}

var template = "" +
    "<b>Profiles:</b><br/>" +
    "<% _.each(profiles, function(profile){ %>" +
        "<div class='indent'>" +
            "<a href='#' class='layerSelector' data-layer='<%= profile.layerNumber %>'>Layer <%= profile.layerNumber %></a>" +
        "</div>" +
    "<% }); %>";

var compiledTemplate = _.template(template);

function renderProfileUI(){

    $("#profileUI").html(compiledTemplate({profiles: profiles})).show();

    $(".layerSelector").click(function(e){
        e.preventDefault();
        var _layerNumber = $(e.target).data("layer");
        if (_layerNumber === undefined) return;
        _layerNumber = parseInt(_layerNumber);
        if (isNaN(_layerNumber)) return;
        if (_layerNumber >= size[2]) return;
        if (_layerNumber < 0) return;
        layerNumber = _layerNumber;
        $("#layerNumber").val(layerNumber);
        $('#flythroughSlider>div').slider( "value", layerNumber);
        getLayer();
    });
}

function updateControlPoints(){
    if (controlPoints === undefined) return;
    for (var i=0;i<controlPoints.length;i++){
        controlPoints[i].setScale();
    }
}

function mouseMove(e){

    if (controlPoints == undefined || controlPoints.length <= 0) return;

    if (mouseDown) {
        isDragging = true;
    }

    e.preventDefault();
    mouse.x = (e.clientX/window.innerWidth)*2-1;
    mouse.y = - (e.clientY/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, threeView.camera);

    var _highlightedObj = null;
    if (!isDragging) {
        var objsToIntersect = cpMeshes;
        _highlightedObj = checkForIntersections(e, objsToIntersect);
        setHighlightedObj(_highlightedObj);
    }  else if (isDragging && highlightedObj){
        if (!draggingCP) {
            draggingCP = highlightedObj;
        }
        var intersection = getIntersectionWithObjectPlane(highlightedObj.getPosition().clone());
        highlightedObj.moveManually(intersection);
        addProfile();
        boundary.geometry.verticesNeedUpdate = true;
        threeView.render();
    }
}

function getIntersectionWithObjectPlane(position){
    // var cameraOrientation = threeView.camera.getWorldDirection();
    // var dist = position.dot(cameraOrientation);
    // raycasterPlane.set(cameraOrientation, -dist);
    var intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(raycasterPlane, intersection);
    return intersection;
}

function setHighlightedObj(object){
    if (highlightedObj && (object != highlightedObj)) {
        highlightedObj.unhighlight();
        // globals.controls.hideMoreInfo();
    }
    highlightedObj = object;
    if (highlightedObj) highlightedObj.highlight();
    threeView.render();
}

function checkForIntersections(e, objects){
    var _highlightedObj = null;
    var intersections = raycaster.intersectObjects(objects, true);
    if (intersections.length > 0) {
        var objectFound = false;
        _.each(intersections, function (thing) {
            if (objectFound) return;
            if (thing.object && thing.object._myNode){
                _highlightedObj = thing.object._myNode;
                if (!_highlightedObj.fixed) return;
                _highlightedObj.highlight();
                objectFound = true;
            }
        });
    }
    return _highlightedObj;
}