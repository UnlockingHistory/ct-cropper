/**
 * Created by amandaghassaei on 3/17/17.
 */

var plane;
var vertices;
var boundary;
var controlPoints;
var mesh;

function initDataView(){
    var planeGeo = new THREE.PlaneBufferGeometry(1, 1);
    var planeMat = new THREE.MeshBasicMaterial({color:0xffffff});
    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.visible = false;
    threeView.scene.add(plane);

    threeView.controls.addEventListener('change', updateControlPoints);
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
    var geometry = new THREE.Geometry();
    for (var i=0;i<numPoints;i++){
        var theta = i*Math.PI*2/numPoints;
        var cp = new ControlPoint(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 1));
        vertices.push(cp.getPosition());
        controlPoints.push(cp);
    }
    vertices.push(vertices[0]);
    geometry.vertices = vertices;
    geometry.dynamic = true;
    var material = new THREE.LineBasicMaterial({
        color: 0xff00ff
    });
    boundary = new THREE.Line( geometry, material );
    threeView.scene.add(boundary);
    threeView.render();
}

function updateControlPoints(){
    if (controlPoints === undefined) return;
    for (var i=0;i<controlPoints.length;i++){
        controlPoints[i].setScale();
    }
}