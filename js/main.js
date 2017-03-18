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
var dataType = "int16";
var dataLength = allDataTypes[dataType];
var headerLength = 200;


var layerNumber = 0;
var size = [0,0,0];

var reader = new FileReader();
// reader.onload = chunkRead;

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    if (files.length<1) return;
    currentFile = files[0];
    currentFileName = currentFile.name;
    currentFileSize = currentFile.size;

    $("#currentFileName").html(currentFileName);
    $("#currentFileSize").html(currentFileSize);
    $("#fileInfo").show();

    readHeader();

    layerNumber = 0;
    $("#layerNumber").val(layerNumber);
}

function chunkRead(e){
    if (e.target.error == null) {
        console.log(e.target);
    } else {
        console.log("Read error: " + e.target.error);
    }
}

function readHeader(){
    reader.onload = parseHeader;
    readChunk(0, 3);
}

function parseHeader(e){
    if (e.target.error == null) {
        var data = new Int16Array(e.target.result);
        size = [data[0], data[1], data[2]];
        showSize();
    } else {
        console.log("Read error: " + e.target.error);
        return;
    }
    reader.onload = chunkRead;
}

function readChunk(start, numPixels){
    if (!currentFile) return;
    var length = dataLength*numPixels;
    var blob = currentFile.slice(start, length+start);
    reader.readAsArrayBuffer(blob);
}

$(document).ready(function(){

    initControls();

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
    } else {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    $("#fileSelector").change(handleFileSelect);
});