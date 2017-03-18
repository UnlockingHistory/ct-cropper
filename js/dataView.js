/**
 * Created by amandaghassaei on 3/17/17.
 */

var sprite = new THREE.Sprite();

function initDataView(){
    threeView.render();
}


function showData(data) {
var side = 35;
var amount = Math.pow(side, 2); // you need 4 values for every pixel in side*side plane
var data = new Uint8Array(amount);
/*
  You can also use any js typed array or ArrayBuffer itself
  Most popular is Uint8Array (it can contain itegers from 0 to 255)
*/
for (var i = 0; i < amount; i++) {
  data[i] = Math.random()*256; // generates random r,g,b,a values from 0 to 1
  /*
    When using Uint8Array multiply the random value by 255 to get same results
    'cause in that case you use integers from 0 to 255 to represent colors
    which is limiting but is more widely supported (see comment below)
  */
}
// console.log(renderer.context.getExtension('OES_texture_float'));
// console.log(renderer.context.getExtension('OES_texture_float_linear'));
/*
   If you got nothing, check console to see if you have this extension
   If not: use Uint8Array instead of Float32Array and THREE.UnsignedByteType istead of
   THREE.FloatType in texture constructor
*/
var dataTex = new THREE.DataTexture(data, side, side, THREE.LuminanceFormat, THREE.UnsignedByteType);
console.log(dataTex);
/*
  In order to use the types THREE.FloatType and THREE.HalfFloatType, the WebGL implementation must support the respective extensions OES_texture_float and OES_texture_half_float.
  http://threejs.org/docs/index.html#Reference/Textures/DataTexture
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Using_Extensions
*/
// dataTex.magFilter = THREE.NearestFilter; // also check out THREE.LinearFilter just to see the results
dataTex.needsUpdate = true; // somehow this line is required for this demo to work. I have not figured that out yet.

/*Plane*/
var planeGeo = new THREE.PlaneBufferGeometry(15, 15);
var planeMat = new THREE.MeshBasicMaterial({map: dataTex, transparent: true });
var plane = new THREE.Mesh(planeGeo, planeMat);
threeView.scene.add(plane);

/*Render*/
threeView.render();




    // var rgba = new Uint8Array(size[0]*size[1]*4);
    // for (var i=0;i<size[0]*size[1];i++){
    //     var index = i*4;
    //     rgba[index] = data[3*i];
    //     rgba[index+1] = data[3*i+1];
    //     rgba[index+2] = data[3*i+2];
    //     rgba[index+3] = 255;
    // }
    // var texture = new THREE.DataTexture(index, size[0], size[1], THREE.RGBAFormat, THREE.UnsignedByteType);
    // console.log(texture);
    // texture.needsUpdate = true;
    // // var material = new THREE.SpriteMaterial({map:texture, color:0xffffff});
    //
    // var material = new THREE.MeshBasicMaterial( { map: texture } );
    //
    // var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(15, 15), material);
    //
    // threeView.scene.add( plane );
    // threeView.render();
}