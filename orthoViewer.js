     var drawingManager;
            var selectedShape;
            var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
            var selectedColor;
            var colorButtons = {};
var map;
var measureTool;
var mapBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(46.52068326065952, 6.56181654645541),
    new google.maps.LatLng(46.52527674432699, 6.56842632333201));
var mapMinZoom = 10;
var mapMaxZoom = 22;
var squareDrawing;
var circleDrawing;
var polygonDrawing;
var polylineDrawing;

var circleButton;
var squareButton;
var polygonButton;
var polylineButton;
    // state
var _selection = null;
var _map = null;
var _drawingManager = null;
var _newShapeNextId = 0;
var _shapes = Array();
var shapesVisible;
var overlay;

// types

var RECTANGLE = google.maps.drawing.OverlayType.RECTANGLE;
var CIRCLE = google.maps.drawing.OverlayType.CIRCLE;
var POLYGON = google.maps.drawing.OverlayType.POLYGON;
var POLYLINE = google.maps.drawing.OverlayType.POLYLINE;
var MARKER = google.maps.drawing.OverlayType.MARKER;

var maptiler = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        var proj = map.getProjection();
        var z2 = Math.pow(2, zoom);
        var tileXSize = 256 / z2;
        var tileYSize = 256 / z2;
        var tileBounds = new google.maps.LatLngBounds(
            proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
            proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
        );
        var y = z2 - coord.y - 1;
        var x = coord.x >= 0 ? coord.x : z2 + coord.x;
        if (mapBounds.intersects(tileBounds) && (mapMinZoom <= zoom) && (zoom <= mapMaxZoom))
            return 'dataset/' + zoom + "/" + x + "/" + y + ".png";
        else
            return "http://www.maptiler.org/img/none.png";
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true,

    opacity: 1.0
});


            function clearSelection () {
                if (selectedShape) {
                    if (selectedShape.type !== 'marker') {
                        selectedShape.setEditable(false);
                    }

                    selectedShape = null;
                }
            }

            function setSelection (shape) {
                if (shape.type !== 'marker') {
                    clearSelection();
                    shape.setEditable(true);
                    selectColor(shape.get('fillColor') || shape.get('strokeColor'));
                }

                selectedShape = shape;
            }

            function deleteSelectedShape () {
                if (selectedShape) {
                    selectedShape.setMap(null);
                }
            }

            function selectColor (color) {
                selectedColor = color;
                // Retrieves the current options from the drawing manager and replaces the
                // stroke or fill color as appropriate.
                var polylineOptions = drawingManager.get('polylineOptions');
                polylineOptions.strokeColor = color;
                drawingManager.set('polylineOptions', polylineOptions);

                var rectangleOptions = drawingManager.get('rectangleOptions');
                rectangleOptions.fillColor = color;
                drawingManager.set('rectangleOptions', rectangleOptions);

                var circleOptions = drawingManager.get('circleOptions');
                circleOptions.fillColor = color;
                drawingManager.set('circleOptions', circleOptions);

                var polygonOptions = drawingManager.get('polygonOptions');
                polygonOptions.fillColor = color;
                drawingManager.set('polygonOptions', polygonOptions);
            }

            function setSelectedShapeColor (color) {
                if (selectedShape) {
                    if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
                        selectedShape.set('strokeColor', color);
                    } else {
                        selectedShape.set('fillColor', color);
                    }
                    onShapeEdited(selectedShape);
                }
            }





function initMap() {
    var opts = {
        tilt:0,
        streetViewControl: true,
        center: mapBounds.getCenter(),
        zoom: 15
    };

  map = new google.maps.Map(document.getElementById("map"), opts);
  map.setMapTypeId('satellite');
  map.overlayMapTypes.insertAt(0, maptiler);
  measureTool = new MeasureTool(map, {
    contextMenu: false
  });
overlay = new google.maps.OverlayView();
overlay.draw = function() {};
overlay.setMap(map);




  var tools = document.createElement('div');
  var toolsControl = new ToolsControl(tools, map);

   var drawingTools = document.createElement('div');
  var drawingToolsControl = new DrawingToolsControl(drawingTools, map);

  var opacitySlider = document.createElement('div');
  opacitySlider.style.width = "25vw";
  var opacityControl = new SliderControl(opacitySlider,map);
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(opacitySlider);

    var deleteButton = document.createElement('div');
  var deleteControl = new DeleteControl(deleteButton, map);

      var handButton = document.createElement('div');
  var handControl = new HandControl(handButton, map);

  var colorsTool = document.createElement('div');
  var colorsToolControl = new ColorsControl(colorsTool, map);

    var deleteAllTool = document.createElement('div');
  var deleteAllToolControl = new DeleteAllControl(deleteAllTool, map);

      var printTool = document.createElement('div');
  var printToolControl = new PrintControl(printTool, map);

  var toolbar = document.createElement('div');
  toolbar.id = "toolbar";
  toolbar.appendChild(tools);
  toolbar.appendChild(drawingTools);
  toolbar.appendChild(colorsTool);
  toolbar.appendChild(handButton);
  toolbar.appendChild(printTool);
  toolbar.appendChild(deleteButton);
  toolbar.appendChild(deleteAllTool);
  toolbar.index = 0;
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(toolbar);






      var polyOptions = {
                    strokeWeight: 0,
                    fillOpacity: 0.45,
                    editable: true,
                    draggable: true
                };
                // Creates a drawing manager attached to the map that allows the user to draw
                // markers, lines, and shapes.
                drawingManager = new google.maps.drawing.DrawingManager({
                    drawingMode: null,
                    drawingControl: false,
                    markerOptions: {
                        draggable: true,
                        icon: "https://github.com/google/material-design-icons/raw/master/maps/1x_web/ic_place_white_48dp.png"
                    },
                    polylineOptions: {
                        editable: true,
                        draggable: true
                    },
                    rectangleOptions: polyOptions,
                    circleOptions: polyOptions,
                    polygonOptions: polyOptions,
                    map: map
                });

                google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
                    squareButton.style.backgroundColor = "grey";
                    circleButton.style.backgroundColor = 'grey';
                    polygonButton.style.backgroundColor = "grey";
                    polylineButton.style.backgroundColor = "grey";

                    squareDrawing = false;
                    circleDrawing = false;
                    polygonDrawing = false;
                    polylineDrawing = false;

                    var newShape = e.overlay;

                    newShape.type = e.type;

                    if (e.type !== google.maps.drawing.OverlayType.MARKER) {
                        // Switch back to non-drawing mode after drawing a shape.
                        drawingManager.setDrawingMode(null);

                        // Add an event listener that selects the newly-drawn shape when the user
                        // mouses down on it.
                        google.maps.event.addListener(newShape, 'click', function (e) {
                            if (e.vertex !== undefined) {
                                if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
                                    var path = newShape.getPaths().getAt(e.path);
                                    path.removeAt(e.vertex);
                                    if (path.length < 3) {
                                        newShape.setMap(null);
                                    }
                                }
                                if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
                                    var path = newShape.getPath();
                                    path.removeAt(e.vertex);
                                    if (path.length < 2) {
                                        newShape.setMap(null);
                                    }
                                }
                            }
                            setSelection(newShape);
                        });
                        setSelection(newShape);
                    }
                    else {
                        drawingManager.setDrawingMode(null);
                        google.maps.event.addListener(newShape, 'click', function (e) {
                            setSelection(newShape);
                        });
                        google.maps.event.addListener(newShape, 'position_changed', function (e) {
                            console.log(newShape.getPosition().toString());
                        });
                        setSelection(newShape);
                    }
                });

                // Clear the current selection when the drawing mode is changed, or when the
                // map is clicked.
                google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
                  google.maps.event.addListener(
            drawingManager,
            'overlaycomplete',
            onNewShape);
                google.maps.event.addListener(map, 'click', clearSelection);

}



initMap();
selectColor('yellow');




    function typeDesc(type) {
        switch (type) {
        case RECTANGLE:
            return "rectangle";

        case CIRCLE:
            return "circle";

        case POLYGON:
            return "polygon";

        case POLYLINE:
            return "polyline";

        case MARKER:
            return "marker";

        case null:
            return "null";

        default:
            return "UNKNOWN GOOGLE MAPS OVERLAY TYPE";
        }
    }

    // json reading

    function jsonReadPath(jsonPath) {
        var path = new google.maps.MVCArray();

        for (var i = 0; i < jsonPath.path.length; i++) {
            var latlon =
                new google.maps.LatLng(jsonPath.path[i].lat, jsonPath.path[i].lon);
            path.push(latlon);
        }

        return path;
    }

    function jsonReadRectangle(jsonRectangle) {
        var jr = jsonRectangle;
        var southWest = new google.maps.LatLng(
            jr.bounds.southWest.lat,
            jr.bounds.southWest.lon);
        var northEast = new google.maps.LatLng(
            jr.bounds.northEast.lat,
            jr.bounds.northEast.lon);
        var bounds = new google.maps.LatLngBounds(southWest, northEast);

        var rectangleOptions = {
            bounds: bounds,
            editable: false,
            fillColor: jr.color,
            map: _map
        };

        var rectangle = new google.maps.Rectangle(rectangleOptions);

        return rectangle;
    }

    function jsonReadCircle(jsonCircle) {
        var jc = jsonCircle;

        var center = new google.maps.LatLng(
            jc.center.lat,
            jc.center.lon);

        var circleOptions = {
            center: center,
            radius: parseFloat(jc.radius),
            editable: false,
            fillColor: jc.color,
            map: _map
        };

        var circle = new google.maps.Circle(circleOptions);

        return circle;
    }

    function jsonReadPolyline(jsonPolyline) {
        var path = jsonReadPath(jsonPolyline);

        var polylineOptions = {
            path: path,
            editable: false,
            strokeColor: jsonPolyline.color,
            map: _map
        };

        var polyline = new google.maps.Polyline(polylineOptions);

        return polyline;
    }

    function jsonReadPolygon(jsonPolygon) {
        var paths = new google.maps.MVCArray();

        for (var i = 0; i < jsonPolygon.paths.length; i++) {
            var path = jsonReadPath(jsonPolygon.paths[i]);
            paths.push(path);
        }

        var polygonOptions = {
            paths: paths,
            editable: false,
            fillColor: jsonPolygon.color,
            map: _map
        };

        var polygon = new google.maps.Polygon(polygonOptions);

        return polygon;
    }

    function jsonRead(json) {
        var jsonObject = eval("(" + json + ")");

        for (i = 0; i < jsonObject.shapes.length; i++)
        {
            switch (jsonObject.shapes[i].type) {
            case RECTANGLE:
                var rectangle = jsonReadRectangle(jsonObject.shapes[i]);
                newShapeSetProperties(rectangle, RECTANGLE);
                newShapeAddListeners(rectangle);
                shapesAdd(rectangle);
                break;

            case CIRCLE:
                var circle = jsonReadCircle(jsonObject.shapes[i]);
                newShapeSetProperties(circle, CIRCLE);
                newShapeAddListeners(circle);
                shapesAdd(circle);
                break;

            case POLYLINE:
                var polyline = jsonReadPolyline(jsonObject.shapes[i]);
                newShapeSetProperties(polyline, POLYLINE);
                newShapeAddListeners(polyline);
                shapesAdd(polyline);
                break;

            case POLYGON:
                var polygon = jsonReadPolygon(jsonObject.shapes[i]);
                newShapeSetProperties(polygon, POLYGON);
                newShapeAddListeners(polygon);
                shapesAdd(polygon);
                break;
            }
        }
    }

    // json writing

    function comma(i) {
        return (i > 0) ? ',' : '';
    }

    function jsonMakeLatlon(latlon) {
        var buf =
            '"lat":"' + latlon.lat() + '","lon":"' + latlon.lng() + '"';

        return buf;
    }

    function jsonMakeBounds(bounds) {
        var buf =
            '"bounds":{'
            + '"northEast":{' + jsonMakeLatlon(bounds.getNorthEast()) + '},'
            + '"southWest":{' + jsonMakeLatlon(bounds.getSouthWest()) + '}'
            + '}';

        return buf;
    }

    function jsonMakeType(type) {
        var buf = '"type":"' + typeDesc(type) + '"';

        return buf;
    }

    function jsonMakeColor(color) {
        var buf = '"color":"' + color + '"';

        return buf;
    }

    function jsonMakeCenter(center) {
        var buf = '"center":{' + jsonMakeLatlon(center) + '}';

        return buf;
    }

    function jsonMakeRadius(radius) {
        var buf = '"radius":"' + radius + '"';

        return buf;
    }

    function jsonMakePath(path) {
        var n = path.getLength();

        var buf = '"path":[';
        for (var i = 0; i < n; i++) {
            var latlon = path.getAt(i);

            buf += comma(i) + '{' + jsonMakeLatlon(latlon) + '}';
        }
        buf += ']';

        return buf;
    }

    function jsonMakePaths(paths) {
        var n = paths.getLength();

        var buf = '"paths":[';
        for (var i = 0; i < n; i++) {
            var path = paths.getAt(i);

            buf += comma(i) + '{' + jsonMakePath(path) + '}';
        }
        buf += ']';

        return buf;
    }

    function jsonMakeRectangle(rectangle) {
        var buf =
            jsonMakeType(RECTANGLE) + ','
            + jsonMakeColor(rectangle.fillColor) + ','
            + jsonMakeBounds(rectangle.bounds);

        return buf;
    }

    function jsonMakeCircle(circle) {
        var buf =
            jsonMakeType(CIRCLE) + ','
            + jsonMakeColor(circle.fillColor) + ','
            + jsonMakeCenter(circle.center) + ','
            + jsonMakeRadius(circle.radius);

        return buf;
    }

    function jsonMakePolyline(polyline) {
        var buf =
            jsonMakeType(POLYLINE) + ','
            + jsonMakeColor(polyline.strokeColor) + ','
            + jsonMakePath(polyline.getPath());

        return buf;
    }

    function jsonMakePolygon(polygon) {
        var buf =
            jsonMakeType(POLYGON) + ','
            + jsonMakeColor(polygon.fillColor) + ','
            + jsonMakePaths(polygon.getPaths());

        return buf;
    }

    function jsonMake() {
        var buf = '{"shapes":[';
        for (i = 0; i < _shapes.length; i++) {
            switch (_shapes[i].type)
            {
            case RECTANGLE:
                buf += comma(i) + '{' + jsonMakeRectangle(_shapes[i]) + '}';
                break;

            case CIRCLE:
                buf += comma(i) + '{' + jsonMakeCircle(_shapes[i]) + '}';
                break;

            case POLYLINE:
                buf += comma(i) + '{' + jsonMakePolyline(_shapes[i]) + '}';
                break;

            case POLYGON:
                buf += comma(i) + '{' + jsonMakePolygon(_shapes[i]) + '}';
                break;
            }
        }
        buf += ']}';

        return buf;
    }

      function newShapeAddPathListeners(shape, path) {
        google.maps.event.addListener(
            path,
            'insert_at',
            function () {onShapeEdited(shape)});
        google.maps.event.addListener(
            path,
            'remove_at',
            function () {onShapeEdited(shape)});
        google.maps.event.addListener(
            path,
            'set_at',
            function () {onShapeEdited(shape)});
    }

    function newShapeAddListeners(shape) {
        google.maps.event.addListener(
            shape,
            'click',
            function () {onShapeClicked(shape);});

        switch (shape.type) {
        case RECTANGLE:
            google.maps.event.addListener(
                shape,
                'bounds_changed',
                function () {onShapeEdited(shape);});
            break;

        case CIRCLE:
            google.maps.event.addListener(
                shape,
                'center_changed',
                function () {onShapeEdited(shape);});
            google.maps.event.addListener(
                shape,
                'radius_changed',
                function () {onShapeEdited(shape);});
            break;

        case POLYLINE:
            var path = shape.getPath();
            newShapeAddPathListeners(shape, path);
            break;

        case POLYGON:
            var paths = shape.getPaths();

            var n = paths.getLength();
            for (var i = 0; i < n; i++) {
                var path = paths.getAt(i);
                newShapeAddPathListeners(shape, path);
            }
            break;
        }
    }

        function selectionPrint() {
        if (_selection == null) {
            console.log("selection cleared\n");
        }
        else {
            console.log(_selection.appId + ": selected\n");
        }
    }

        function selectionSet(newSelection) {
        if (newSelection == _selection) {
            return;
        }

        if (_selection != null) {
          if (_selection.type !== 'marker') {
            _selection.setEditable(false);
                    }
            _selection = null;
        }

        if (newSelection != null) {
            _selection = newSelection;
               if (_selection.type !== 'marker') {
            _selection.setEditable(true);
                    }
        }

        selectionPrint();
    }

    function selectionClear() {
        selectionSet(null);
    }

    function selectionDelete() {
        if (_selection != null) {
            _selection.setMap(null);
            selectionClear();
        }
    }

      function newShapeSetProperties(shape, type) {
        shape.type = type;
        shape.appId = _newShapeNextId;

        _newShapeNextId++;
    }

     function shapesAdd(shape) {
        _shapes.push(shape);
    }

        function shapesDelete(shape) {
        var found = false;

        for (var i = 0; i < _shapes.length && !found; i++) {
            if (_shapes[i] === shape) {
                _shapes.splice(i, 1);
                found = true;
            }
        }
    }

    function shapesHideAll() {
        for (var i = 0; i < _shapes.length; i++) {
            _shapes[i].setMap(null);
        }
    }

     function shapesShowAll() {
        for (var i = 0; i < _shapes.length; i++) {
            _shapes[i].setMap(map);
        }
    }

    function shapesDeleteAll() {
        console.log(_shapes.length + " shapes deleted\n");

        _shapes.splice(0, _shapes.length);
        console.log(_shapes);
    }



    // event capture

    function onNewShape(event) {
        var shape = event.overlay;

        newShapeSetProperties(shape, event.type);
        newShapeAddListeners(shape);
        shapesAdd(shape);
        shapesSave();
        console.log(_shapes);
        selectionSet(shape);

        console.log("new " + typeDesc(event.type) + " created (id = "
              + shape.appId + ")\n");
    }

    function onShapeEdited(shape) {
        console.log(shape.appId + ": shape edited\n");
        console.log('need to save');
        shapesSave();
    }

    function onShapeClicked(shape) {
        console.log(shape.appId + ": shape clicked\n");
        selectionSet(shape);
    }

    function onMapClicked() {
        console.log("map clicked\n");
        selectionClear();
    }

    function onDeleteButtonClicked() {
        console.log("delete button clicked\n");

        if (selectionIsSet()) {
            shapesDelete(_selection);
            console.log('need to save');
            selectionDelete();
        }
        shapesSave();
    }

      function shapesSave() {
        var shapes = jsonMake();
        console.log(shapes)


    }

    function onClearButtonClicked() {
        console.log("clear button clicked\n");

        selectionClear();
        shapesHideAll();
        shapesDeleteAll();
        console.log('need to save');
    }

    function onDrawingModeChanged() {
        console.logDrawingMode(drawingManager);
        selectionClear();
    }



function savePolygon() {
    map.data.toGeoJson(function (json) {
      console.log(JSON.stringify(json))
    });
}

function bindDataLayerListeners(dataLayer) {
    dataLayer.addListener('addfeature', savePolygon);
    dataLayer.addListener('removefeature', savePolygon);
    dataLayer.addListener('setgeometry', savePolygon);
}


    function DeleteControl(controlDiv,map){
             // Set CSS for the control border.
        var deleteButton = document.createElement('a');
        deleteButton.className = "btn-floating btn-large grey";
        deleteButton.id = "deleteButton";
        deleteButton.title = 'Delete';
        controlDiv.appendChild(deleteButton);

            var deleteButtonIcon = document.createElement('i');
        deleteButtonIcon.className = " large material-icons"
        deleteButtonIcon.innerHTML = 'delete';
        deleteButton.appendChild(deleteButtonIcon);
        deleteButton.addEventListener('click', function() {
                    deleteSelectedShape();

        })
    }

       function DeleteAllControl(controlDiv,map){
             // Set CSS for the control border.
        var deleteAllButton = document.createElement('a');
        deleteAllButton.className = "btn-floating btn-large red";
        deleteAllButton.id = "deleteAllButton";
        deleteAllButton.title = 'Delete All';
        controlDiv.appendChild(deleteAllButton);

            var deleteAllButtonIcon = document.createElement('i');
        deleteAllButtonIcon.className = " large material-icons"
        deleteAllButtonIcon.innerHTML = 'delete_forever';
        deleteAllButton.appendChild(deleteAllButtonIcon);
        deleteAllButton.addEventListener('click', function() {
                    onClearButtonClicked();

        })
    }

        function HandControl(controlDiv,map){
             // Set CSS for the control border.
        var handButton = document.createElement('a');
        handButton.className = "btn-floating btn-large blue";
        handButton.id = "handButton";
        handButton.title = 'Move';
        controlDiv.appendChild(handButton);

            var handButtonIcon = document.createElement('i');
        handButtonIcon.className = " large material-icons"
        handButtonIcon.innerHTML = 'pan_tool';
        handButton.appendChild(handButtonIcon);
        handButton.addEventListener('click', function() {
                    drawingManager.setDrawingMode(null);


        })
    }

           function PrintControl(controlDiv,map){
             // Set CSS for the control border.
        var printButton = document.createElement('a');
        printButton.className = "btn-floating btn-large pink";
        printButton.id = "printButton";
        printButton.title = 'Print';
        controlDiv.appendChild(printButton);

            var printButtonIcon = document.createElement('i');
        printButtonIcon.className = " large material-icons"
        printButtonIcon.innerHTML = 'print';
        printButton.appendChild(printButtonIcon);
        printButton.addEventListener('click', function() {
                    print();
        })
    }


     function ToolsControl(controlDiv, map) {

        // Set CSS for the control border.
        var fixedActionButton = document.createElement('div');
        fixedActionButton.className = "fixed-action-btn horizontal";
        fixedActionButton.id = "tools-button";
        var toolsButton = document.createElement('a');
        toolsButton.className = "btn-floating btn-large orange"
        toolsButton.title = 'Tools'
        fixedActionButton.appendChild(toolsButton)
        controlDiv.appendChild(fixedActionButton);
        fixedActionButton.style.removeProperty('bottom');

 // Set CSS for the control interior.
        var toolsButtonIcon = document.createElement('i');
        toolsButtonIcon.className = "material-icons"
        toolsButtonIcon.innerHTML = 'build';
        toolsButton.appendChild(toolsButtonIcon);
        var isMeasuring = false;

        var buttonList = document.createElement('ul');
        var measureButtonLi = document.createElement('li')
        var measureButton = document.createElement('a')
        measureButton.className = "btn-floating"
        measureButton.id = "measureButton";
        measureButton.title = 'Click to start measuring'
        var measureButtonIcon = document.createElement('i');
        measureButtonIcon.className = "material-icons"
        measureButtonIcon.innerHTML = 'straighten';

            var addButtonLi = document.createElement('li')
        var addButton = document.createElement('a')
        addButton.className = "btn-floating"
        addButton.id = "addButton";
        addButton.title = 'Click to start measuring'
        var addButtonIcon = document.createElement('i');
        addButtonIcon.className = "material-icons"
        addButtonIcon.innerHTML = 'add';

                    var visibilityButtonLi = document.createElement('li')
        var visibilityButton = document.createElement('a')
        visibilityButton.className = "btn-floating cyan lighten-1"
        visibilityButton.id = "visibilityButton";
        visibilityButton.title = 'Click to show/hide'
        var visibilityButtonIcon = document.createElement('i');
        visibilityButtonIcon.className = "material-icons"
        visibilityButtonIcon.innerHTML = 'visibility_off';

        measureButton.appendChild(measureButtonIcon);
        measureButtonLi.appendChild(measureButton);
        addButton.appendChild(addButtonIcon);
        addButtonLi.appendChild(addButton);
        visibilityButton.appendChild(visibilityButtonIcon);
        visibilityButtonLi.appendChild(visibilityButton);
        buttonList.appendChild(measureButtonLi);
        buttonList.appendChild(addButtonLi);
        buttonList.appendChild(visibilityButtonLi);
        fixedActionButton.appendChild(buttonList);



        // Setup the click event listeners: simply set the map to Chicago.
        measureButton.addEventListener('click', function() {
          if(isMeasuring){
            measureTool.end();
            measureButton.style.backgroundColor = "grey";
            isMeasuring = false;
          }
          else{
          measureTool.start();
                      measureButton.style.backgroundColor = "green";

          isMeasuring = true;
          }

        });

        // Setup the click event listeners: simply set the map to Chicago.
        addButton.addEventListener('click', function() {
          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
      });
        shapesVisible = true;
        visibilityButton.addEventListener('click', function() {
          if(shapesVisible){
            shapesHideAll();
            shapesVisible = false;
            visibilityButtonIcon.innerHTML ="visibility";
          }
          else{
            shapesShowAll();
            shapesVisible = true;
            visibilityButtonIcon.innerHTML="visibility_off";
          }
      })
      }

           function DrawingToolsControl(controlDiv, map) {

        // Set CSS for the control border.
        var fixedActionButton = document.createElement('div');
        fixedActionButton.className = "fixed-action-btn horizontal";
        fixedActionButton.id = "drawing-tools-button";
        var toolsButton = document.createElement('a');
        toolsButton.className = "btn-floating btn-large green"
        toolsButton.title = 'Drawing Tools'
        fixedActionButton.appendChild(toolsButton)
        controlDiv.appendChild(fixedActionButton);
        fixedActionButton.style.removeProperty('bottom');

 // Set CSS for the control interior.
        var toolsButtonIcon = document.createElement('i');
        toolsButtonIcon.className = "material-icons"
        toolsButtonIcon.innerHTML = 'edit';
        toolsButton.appendChild(toolsButtonIcon);
        var buttonList = document.createElement('ul');

//Square Button
        var squareButtonLi = document.createElement('li')
        squareButton = document.createElement('a')
        squareButton.className = "btn-floating"
        squareButton.id = "measureButton";
        squareButton.title = 'Click to draw a square'
        var squareButtonIcon = document.createElement('i');
        squareButtonIcon.className = "material-icons"
        squareButtonIcon.innerHTML = 'crop_square';
        squareButton.appendChild(squareButtonIcon);
        squareButtonLi.appendChild(squareButton);
        buttonList.appendChild(squareButtonLi);
//circle Button
        var circleButtonLi = document.createElement('li')
        circleButton = document.createElement('a')
        circleButton.className = "btn-floating"
        circleButton.id = "measureButton";
        circleButton.title = 'Click to draw a circle'
        var circleButtonIcon = document.createElement('i');
        circleButtonIcon.className = "material-icons"
        circleButtonIcon.innerHTML = 'panorama_fish_eye';
        circleButton.appendChild(circleButtonIcon);
        circleButtonLi.appendChild(circleButton);
        buttonList.appendChild(circleButtonLi);

//polygon Button
        var polygonButtonLi = document.createElement('li')
        polygonButton = document.createElement('a')
        polygonButton.className = "btn-floating"
        polygonButton.id = "measureButton";
        polygonButton.title = 'Click to draw a polygon'
        var polygonButtonIcon = document.createElement('i');
        polygonButtonIcon.className = "material-icons"
        polygonButtonIcon.innerHTML = 'landscape';
        polygonButton.appendChild(polygonButtonIcon);
        polygonButtonLi.appendChild(polygonButton);
        buttonList.appendChild(polygonButtonLi);

//polyline Button
        var polylineButtonLi = document.createElement('li')
        polylineButton = document.createElement('a')
        polylineButton.className = "btn-floating"
        polylineButton.id = "measureButton";
        polylineButton.title = 'Click to draw a polyline'
        var polylineButtonIcon = document.createElement('i');
        polylineButtonIcon.className = "material-icons"
        polylineButtonIcon.innerHTML = 'timeline';
        polylineButton.appendChild(polylineButtonIcon);
        polylineButtonLi.appendChild(polylineButton);
        buttonList.appendChild(polylineButtonLi);
        fixedActionButton.appendChild(buttonList);


           squareButton.addEventListener('click', function() {
          if(squareDrawing){
            drawingManager.setDrawingMode(null);
            squareButton.style.backgroundColor = "grey";
            squareDrawing = false;
          }
          else{
          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
          squareButton.style.backgroundColor = "green";
          circleButton.style.backgroundColor = 'grey';
                    polygonButton.style.backgroundColor = "grey";
                    polylineButton.style.backgroundColor = "grey";

          squareDrawing = true;
          circleDrawing = false;
          polygonDrawing = false;
          polylineDrawing = false;
          }
        });
                  circleButton.addEventListener('click', function() {
          if(circleDrawing){
            drawingManager.setDrawingMode(null);
            circleButton.style.backgroundColor = "grey";
            circleDrawing = false;
          }
          else{
          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
          circleButton.style.backgroundColor = "green";
          squareButton.style.backgroundColor = "grey";
                    polygonButton.style.backgroundColor = "grey";
                      polylineButton.style.backgroundColor = "grey";

          circleDrawing = true;
          squareDrawing = false;
          polygonDrawing = false;
           polylineDrawing = false;
          }
        });

                  polygonButton.addEventListener('click', function() {
          if(polygonDrawing){
            drawingManager.setDrawingMode(null);
            polygonButton.style.backgroundColor = "grey";
            polygonDrawing = false;
          }
          else{
          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
          polygonButton.style.backgroundColor = "green";
          circleButton.style.backgroundColor = "grey";
          squareButton.style.backgroundColor = "grey";
            polylineButton.style.backgroundColor = "grey";
          polygonDrawing = true;

          circleDrawing = false;
          squareDrawing = false;
           polylineDrawing = false;
          }
        })

                                    polylineButton.addEventListener('click', function() {
          if(polylineDrawing){
            drawingManager.setDrawingMode(null);
            polylineButton.style.backgroundColor = "grey";
            polylineDrawing = false;
          }
          else{
          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
          polylineButton.style.backgroundColor = "green";
          circleButton.style.backgroundColor = "grey";
          squareButton.style.backgroundColor = "grey";
          polygonButton.style.backgroundColor = "grey";
          polylineDrawing = true;
          polygonDrawing = true;
          circleDrawing = false;
          squareDrawing = false;
          }
        })



     }
           function SliderControl(controlDiv, map) {
            var rangeField = document.createElement('p');
            rangeField.className = 'range-field';
            var inputRange = document.createElement('input')
            inputRange.type = 'range';
            inputRange.min = "0";
            inputRange.max = "100";
            inputRange.defaultValue = '100';
            rangeField.appendChild(inputRange);
            controlDiv.appendChild(rangeField);
            inputRange.onchange = function(){
              var opacity = parseFloat(this.value)/100;
              maptiler.setOpacity(opacity);
            }

      }

         function ColorsControl(controlDiv, map) {

        // Set CSS for the control border.
        var fixedActionButton = document.createElement('div');
        fixedActionButton.className = "fixed-action-btn horizontal";
        fixedActionButton.id = "color-button";
        var colorsButton = document.createElement('a');
        colorsButton.className = "btn-floating btn-large"
        colorsButton.title = 'Colors'
        fixedActionButton.appendChild(colorsButton)
        controlDiv.appendChild(fixedActionButton);
        fixedActionButton.style.removeProperty('bottom');

 // Set CSS for the control interior.
        var colorsButtonIcon = document.createElement('i');
        colorsButtonIcon.className = "material-icons"
        colorsButtonIcon.innerHTML = 'color_lens';
        colorsButton.appendChild(colorsButtonIcon);


//Red Color button
        var buttonList = document.createElement('ul');
        var redButtonLi = document.createElement('li')
        var redButton = document.createElement('a')
        redButton.className = "btn-floating red"
        redButton.id = "red";
        redButton.title = 'Set color to red'
        redButtonLi.appendChild(redButton);
        buttonList.appendChild(redButtonLi);
                   redButton.addEventListener('click', function() {
               selectColor('red');
                    setSelectedShapeColor('red');
        })




//Blue Color button
        var blueButtonLi = document.createElement('li')
        var blueButton = document.createElement('a')
        blueButton.className = "btn-floating blue"
        blueButton.id = "blue";
        blueButton.title = 'Set color to blue'
        blueButtonLi.appendChild(blueButton);
        buttonList.appendChild(blueButtonLi);
                      blueButton.addEventListener('click', function() {
               selectColor('blue');
                    setSelectedShapeColor('blue');
        })

//Orange Color button
        var orangeButtonLi = document.createElement('li')
        var orangeButton = document.createElement('a')
        orangeButton.className = "btn-floating orange"
        orangeButton.id = "orange";
        orangeButton.title = 'Set color to orange'
        orangeButtonLi.appendChild(orangeButton);
        buttonList.appendChild(orangeButtonLi);
    orangeButton.addEventListener('click', function() {
               selectColor('orange');
                    setSelectedShapeColor('orange');
        });

//yellow Color button
        var yellowButtonLi = document.createElement('li')
        var yellowButton = document.createElement('a')
        yellowButton.className = "btn-floating yellow"
        yellowButton.id = "yellow";
        yellowButton.title = 'Set color to yellow'
        yellowButtonLi.appendChild(yellowButton);
        buttonList.appendChild(yellowButtonLi);
            yellowButton.addEventListener('click', function() {
               selectColor('yellow');
                    setSelectedShapeColor('yellow');
        });

        //green Color button
        var greenButtonLi = document.createElement('li')
        var greenButton = document.createElement('a')
        greenButton.className = "btn-floating green"
        greenButton.id = "green";
        greenButton.title = 'Set color to green'
        greenButtonLi.appendChild(greenButton);
        buttonList.appendChild(greenButtonLi);
              greenButton.addEventListener('click', function() {
               selectColor('green');
                    setSelectedShapeColor('green');
        });



        fixedActionButton.appendChild(buttonList);



      }

