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

function showData(data) {
    var dataTex = new THREE.DataTexture(data, size[0], size[1], THREE.LuminanceFormat, THREE.UnsignedByteType);
    dataTex.magFilter = THREE.NearestFilter; // also check out THREE.LinearFilter just to see the results
    dataTex.needsUpdate = true; // somehow this line is required for this demo to work. I have not figured that out yet.
    plane.material.map = dataTex;
    plane.material.needsUpdate = true;
    plane.visible = true;
    threeView.render();
}

function makeBoundaryGeometry(numPoints){
    numPoints = parseInt(numPoints);
    if (isNaN(numPoints)) numPoints = 6;
    if (numPoints <= 0) numPoints = 6;
    vertices = [];
    controlPoints = [];
    cpMeshes = [];
    var geometry = new THREE.Geometry();
    for (var i=0;i<numPoints;i++){
        var theta = i*Math.PI*2/numPoints;
        var cp = new ControlPoint(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 1));
        vertices.push(cp.getPosition());
        controlPoints.push(cp);
        cpMeshes.push(cp.getMesh());
    }
    vertices.push(vertices[0]);
    geometry.vertices = vertices;
    geometry.dynamic = true;
    var material = new THREE.LineBasicMaterial({
        color: 0xff00ff
    });
    boundary = new THREE.Line(geometry, material);
    threeView.scene.add(boundary);
    threeView.render();
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