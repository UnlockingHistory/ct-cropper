/**
 * Created by amandaghassaei on 3/17/17.
 */

var allDataTypes = {
    "int8": 1,
    "int16": 2,
    "int32": 2,
    "float32": 4
};

var currentFileName = null;
var currentFileSize = 0;
var currentFile = null;
var dataType = "int8";
var dataLength = allDataTypes[dataType];
var headerLength = 512;

var threeView;


var layerNumber = 0;
var lastLayerRequested = 0;
var size = [1,1,1];
var currentData = null;

var reader = new FileReader();
reader.onload = chunkRead;

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    if (files.length<1) return;
    currentFile = files[0];
    currentFileName = currentFile.name;
    currentFileSize = currentFile.size;

    $("#currentFileName").html(currentFileName);
    $("#currentFileSize").html(numberWithCommas(currentFileSize));
    $("#fileInfo").show();
    $("#flythroughSlider").show();

    layerNumber = 0;
    $("#layerNumber").val(layerNumber);
    $('#flythroughSlider>div').slider( "value", layerNumber);

    readHeader();
    clear();
}

function chunkRead(e){
    if (e.target.error == null) {
        var data = new Uint8Array(e.target.result);
        showData(data);
        currentData = data;
        if (lastLayerRequested != layerNumber) getLayer();
    } else {
        console.log("Read error: " + e.target.error);
    }
}

function readHeader(){
    reader.onload = parseHeader;
    readChunk(0, 6);
}

function parseHeader(e){
    if (e.target.error == null) {
        var data = new Int16Array(e.target.result);
        size = [data[0], data[1], data[2]];
        layerNumber = 0;
        $("#layerNumber").val(layerNumber);
        reader.onload = chunkRead;
        changeSize();
    } else {
        console.log("Read error: " + e.target.error);
    }
}

function readChunk(start, numPixels){
    if (!currentFile) return;
    var length = dataLength*numPixels;
    var blob = currentFile.slice(start, length+start);
    reader.readAsArrayBuffer(blob);
}

$(document).ready(function(){

    threeView = ThreeView();
    initDataView();
    initControls();

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
    } else {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    $("#fileSelector").change(handleFileSelect);
});