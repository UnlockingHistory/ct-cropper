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
var headerSize = 0;

var layerNumber = 0;

var reader = new FileReader();
reader.onload = chunkRead;

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    if (files.length<1) return;
    currentFile = files[0];
    currentFileName = currentFile.name;
    currentFileSize = currentFile.size;

    $("#currentFileName").html(currentFileName);
    $("#currentFileSize").html(currentFileSize);
    $("#fileInfo").show();

    readChunk(0, 200);
}

function chunkRead(e){
    if (e.target.error == null) {
        console.log(e.target);
    } else {
        console.log("Read error: " + e.target.error);
    }
}

function readChunk(start, numPixels){
    if (!currentFile) return;
    var length = dataLength*numPixels;
    var blob = currentFile.slice(start, length+start);
    reader.readAsText(blob);
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