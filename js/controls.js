/**
 * Created by ghassaei on 10/7/16.
 */

function changeSize(dontUpdateInputs){
    if (dontUpdateInputs === undefined){
        $("#sizeX").val(size[0]);
        $("#sizeY").val(size[1]);
        $("#sizeZ").val(size[2]);
    }
    $('#flythroughSlider>div').slider( "option", "max", size[2]-1);
    plane.scale.set(size[0], size[1], 1);
    getLayer();
}

function getLayer(){
    if (reader.readyState == 1) return;//busy
    var offset = size[0]*size[1]*layerNumber*dataLength + headerLength;
    var length = size[0]*size[1]*dataLength;
    if ((offset + length) > currentFileSize){
        console.warn("bad dimensions");
        return;
    }
    lastLayerRequested = layerNumber;
    readChunk(offset, length);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initControls(){

    setLink("#about", function(){
        $('#aboutModal').modal('show');
    });

    setLink("#upload", function(e){
        $("#fileSelector").click();
        $(e.target).blur();
    });

    setInput("#layerNumber", layerNumber, function(val){
        layerNumber = val;
        $('#flythroughSlider>div').slider( "value", layerNumber);
        getLayer();
    }, 0);

    setInput("#headerLength", headerLength, function(val){
        headerLength = val;
        getLayer();
    }, 0);

    setInput("#sizeX", size[0], function(val){
        size[0] = val;
        changeSize(true);
    }, 1);
    setInput("#sizeY", size[1], function(val){
        size[1] = val;
        changeSize(true);
    }, 1);
    setInput("#sizeZ", size[2], function(val){
        size[2] = val;
        changeSize(true);
    }, 1);

    setSlider("#flythroughSlider>div", layerNumber, 0, size[2]-1, 1, function(val){
        layerNumber = val;
        $("#layerNumber").val(val);
        getLayer();
    });

    setLink("#layerUp", function(){
        if (layerNumber >= size[2]-1) return;
        layerNumber++;
        $("#layerNumber").val(layerNumber);
        $('#flythroughSlider>div').slider( "value", layerNumber);
        getLayer();
    });

    setLink("#layerDown", function(){
        if (layerNumber <= 0) return;
        layerNumber--;
        $("#layerNumber").val(layerNumber);
        $('#flythroughSlider>div').slider( "value", layerNumber);
        getLayer();
    });

    setLink("#start", function(){
        makeBoundaryGeometry($("#numVerticesInit").val());
        $("#initOptions").hide();
    });

    setInput("#upperBound", upperBound, function(val){
        if (val>=size[2]) {
            $("#upperBound").val(size[2]-1);
            return;
        }
        upperBound = val;
        updateBoundary();
    }, 0);

    setInput("#lowerBound", lowerBound, function(val){
        if (val>=size[2]) {
            $("#lowerBound").val(size[2]-1);
            return;
        }
        lowerBound = val;
        updateBoundary();
    }, 0);

    setLink("#save", function(){
        var $saveAsModal = $('#saveAsModal');
        var $saveAsFilename = $("#saveAsFileName");
        var filename = currentFileName.split(".")[0];
        filename += "_";
        var dimensions = getDimensions();
        if (dimensions === null){
            console.warn("bad dimensions");
            return;
        }
        var dimensionsTxt = dimensions.join("x");
        filename += dimensionsTxt;
        filename += ".tom";
        $saveAsFilename.val(filename);
        $("#outputFileDimensions").html(dimensionsTxt);
        $("#fillVal").val(0);
        var filesize = dimensions[0]*dimensions[1]*dimensions[2]*dataLength+headerLength;
        $("#outputFileSize").html(numberWithCommas(filesize));
        $saveAsModal.modal('show');
        $saveAsModal.on('shown.bs.modal', function() {
            $saveAsFilename.focus();
            $saveAsFilename.select();
        });
    });

    setLink("#saveAsTOMModal", function(){

        var filename = $("#saveAsFileName").val();
        var fillVal = $("#fillVal").val();
        fillVal = parseFloat(fillVal);
        if (isNaN(fillVal)) return;
        fillVal = parseInt(fillVal);

        var dimensions = getDimensions();
        if (dimensions === null){
            console.warn("bad dimensions");
            return;
        }
        var filesize = dimensions[0]*dimensions[1]*dimensions[2]*dataLength+headerLength;

        var bounds = getBounds();

        const fileStream = streamSaver.createWriteStream(filename, filesize);
        const writer = fileStream.getWriter();

        var currentOffset = 0;
        var currentZ = bounds.min.z;

        var saveReader = new FileReader();

        function loadData(length){
            var blob = currentFile.slice(currentOffset, length+currentOffset);
            currentOffset += length;
            saveReader.readAsArrayBuffer(blob);
        }

        function updateAndSaveHeader(e){
            if (e.target.error == null) {
                var headerData = new Uint8Array(e.target.result);
                headerData[1] = dimensions[0] >> 8;
                headerData[0] = dimensions[0] & 255;
                headerData[3] = dimensions[1] >> 8;
                headerData[2] = dimensions[1] & 255;
                headerData[5] = dimensions[2] >> 8;
                headerData[4] = dimensions[2] & 255;
                writer.write(headerData);
                saveBinData();
            } else {
                console.log("Read error: " + e.target.error);
                writer.abort("read error");
            }
        }

        //header
        saveReader.onload = updateAndSaveHeader;
        loadData(headerLength);
        currentOffset += currentZ*size[0]*size[1]*dataLength;

        function saveBinData(){
            saveReader.onload = function(e){
                if (e.target.error == null) {
                    var allLayerData = new Uint8Array(e.target.result);

                    //crop to bounds
                    var croppedLayerData = new Uint8Array(dimensions[0]*dimensions[1]);
                    var i = 0;
                    for (var y=bounds.min.y;y<=bounds.max.y;y++){
                        for (var x=bounds.min.x;x<=bounds.max.x;x++){
                            var val = allLayerData[y*size[0]+x];
                            if (val === undefined) val = fillVal;
                            croppedLayerData[i] = val;
                            i++;
                        }
                    }

                    writer.write(croppedLayerData);
                    currentZ++;
                    if (currentZ > bounds.max.z) {
                        writer.close();
                        return;
                    }
                    loadData(dataLength*size[0]*size[1]);//get next chunk
                } else {
                    console.log("Read error: " + e.target.error);
                    writer.abort("read error");
                }
            };

            loadData(dataLength*size[0]*size[1]);
        }
    });

    function setButtonGroup(id, callback){
        $(id+" a").click(function(e){
            e.preventDefault();
            var $target = $(e.target);
            var val = $target.data("id");
            if (val) {
                $(id+" span.dropdownLabel").html($target.html());
                callback(val);
            }
        });
    }

    function setLink(id, callback){
        $(id).click(function(e){
            e.preventDefault();
            callback(e);
        });
    }

    function setRadio(name, val, callback){
        $("input[name=" + name + "]").on('change', function() {
            var state = $("input[name="+name+"]:checked").val();
            callback(state);
        });
        $(".radio>input[value="+val+"]").prop("checked", true);
    }

    function setInput(id, val, callback, min, max){
        var $input = $(id);
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }
            if (min !== undefined && val < min) val = min;
            if (max !== undefined && val > max) val = max;
            $input.val(val);
            callback(val);
        });
        $input.val(val);
    }

    function setCheckbox(id, state, callback){
        var $input  = $(id);
        $input.on('change', function () {
            if ($input.is(":checked")) callback(true);
            else callback(false);
        });
        $input.prop('checked', state);
    }

    function setSlider(id, val, min, max, incr, callback, callbackOnStop){
        var slider = $(id).slider({
            orientation: 'vertical',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });
        slider.on("slide", function(e, ui){
            var val = ui.value;
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
    }

    function setLogSliderInput(id, val, min, max, incr, callback){

        var scale = (Math.log(max)-Math.log(min)) / (max-min);

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: (Math.log(val)-Math.log(min)) / scale + min,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', (Math.log(val)-Math.log(min)) / scale + min);
            callback(val, id);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            val = Math.exp(Math.log(min) + scale*(val-min));
            $input.val(val.toFixed(4));
            callback(val, id);
        });
    }

    function setSliderInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }
}

