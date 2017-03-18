/**
 * Created by amandaghassaei on 3/17/17.
 */

var plane;

function initDataView(){
    var planeGeo = new THREE.PlaneBufferGeometry(1, 1);
    var planeMat = new THREE.MeshBasicMaterial({color:0xffffff});
    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.visible = false;
    threeView.scene.add(plane);
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