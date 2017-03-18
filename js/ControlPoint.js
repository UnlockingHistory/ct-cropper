/**
 * Created by amandaghassaei on 3/18/17.
 */


var cpMat = new THREE.MeshBasicMaterial({color:0xff00ff});
var cpGeo = new THREE.CircleGeometry(1);

function ControlPoint(position){

    this.mesh = new THREE.Mesh(cpGeo, cpMat);
    this.mesh.position.set(position.x, position.y, position.z);
    this.setScale();
    threeView.scene.add(this.mesh);
}

ControlPoint.prototype.getPosition = function(){
    return this.mesh.position;
};

ControlPoint.prototype.setScale = function(){
    var scale = 5/threeView.camera.zoom;
    this.mesh.scale.set(scale, scale, scale);
};

ControlPoint.prototype.destroy = function(){
    threeView.scene.remove(this.mesh);
    this.mesh = null;
};