/**
 * Created by ghassaei on 9/16/16.
 */

function ThreeView() {

    var scene = new THREE.Scene();
    var $threeContainer = $("#threeContainer");
    var camera = new THREE.OrthographicCamera($threeContainer.innerWidth() / -2, $threeContainer.innerWidth() / 2, $threeContainer.innerHeight() / 2, $threeContainer.innerHeight() / -2, 0.1, 1000);//-40, 40);
    var renderer = new THREE.WebGLRenderer({antialias: true});
    var controls;

    window.addEventListener('resize', onWindowResize, false);

    init();

    function init() {

        renderer.setSize($threeContainer.innerWidth(), $threeContainer.innerHeight());
        $threeContainer.append(renderer.domElement);

        camera.zoom = 20;
        camera.updateProjectionMatrix();
        camera.position.z = 40;
        camera.up.set( 0, 0, 1 );
        camera.lookAt(new THREE.Vector3(0,0,0));

        controls = new THREE.OrbitControls(camera, $threeContainer.get(0));
        controls.enableRotate = false;
        controls.addEventListener('change', render);

        scene.background = new THREE.Color(0xf4f4f4);

        render();
    }

    function _render() {
        renderer.render(scene, camera);
    }

    function render(){
        _render();
        // console.log("render");
    }

    function onWindowResize() {
        camera.aspect = $threeContainer.innerWidth() / window.innerHeight;
        camera.left = -$threeContainer.innerWidth() / 2;
        camera.right = $threeContainer.innerWidth() / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();

        renderer.setSize($threeContainer.innerWidth(), window.innerHeight);

        render();
    }

    return {
        render: render,
        scene: scene,
        renderer: renderer,
        camera: camera
    }
}