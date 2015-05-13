<?php require '../authenticate.php';

$config = require 'api/Configuration/config.php';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>

    <title>[caMicroscope OSD][Subject: <?php echo json_encode($_GET['tissueId']); ?>][User: <?php echo $_SESSION["name"]; ?>]</title>

    <link rel="stylesheet" type="text/css" media="all" href="css/annotools.css" />
    <!--<link rel="stylesheet" type="text/css" media="all" href="css/jquery-ui.min.css" />-->
    <link rel="stylesheet" type="text/css" media="all" href="css/simplemodal.css" />

    <script src="js/openseadragon/openseadragon-current/openseadragon.js"></script>
    <script src="js/openseadragon/openseadragon-imaginghelper.min.js"></script>
    <script src="js/openseadragon/openseadragon-scalebar.js"></script>
    <script type="text/javascript" src="js/mootools/mootools-core-1.4.5-full-nocompat-yc.js"></script>
    <script type="text/javascript" src="js/mootools/mootools-more-1.4.0.1-compressed.js"></script>
    <script src="js/annotationtools/annotools-openseajax-handler.js"></script>
    <script src="js/imagemetadatatools/osdImageMetadata.js"></script>
    <script src="js/annotationtools/osdAnnotationTools.js"></script>
    <script src="js/dependencies/MD5.js"></script>
    <script src="js/dependencies/jquery.js"></script>
    <script src="js/dependencies/simplemodal.js"></script>
    <style type="text/css">
        .openseadragon
        {
            height: 95%;
            min-height: 99.9%;
            width: 4.75%;
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
            padding: 0;
            background-color: black;
            border: 1px solid black;
            color: white;
        }

	.navWindow
	{
	    position: absolute;
            z-index: 10001;
            right: 0;
            bottom: 0;
            border: 1px solid yellow;
	}


    </style>
</head>

<body>
    <div id="container">
        <div id="externalframe">
        <a href="#" id="zoom_in_button">Zoom In</a>
        <a href="#" id="zoom_out_button">Zoom Out</a>
        <a href="#" id="home_button">Home</a>
        <a href="#" id="edit_button">Edit</a>
        <a href="#" id="toggle_button">Toggle</a>
        <a href="#" id="measure_button">Measure</a>
        <a href="#" id="analysis_tool_button">Analysis Tool</a>
        <a href="#" id="show_navigator_button">Show Navigator</a>
        <!--p id="subject_id"></p-->
        </div>
        <div id="tool"></div>
    </div>
    <div class="demoarea">
        <div id="viewer" class="openseadragon"></div>
        <div id="navigatorDiv" class="navigator"></div>
    </div>
    <script type="text/javascript">
      jQuery.noConflict();
      var annotool = null;
      var tissueId = <?php echo json_encode($_GET['tissueId']); ?>;
      var imagedata = new OSDImageMetaData({imageId:tissueId});
      var MPP = imagedata.metaData[0];
      var fileLocation = imagedata.metaData[1];
      var viewer = new OpenSeadragon.Viewer(
          { id: "viewer", 
            prefixUrl: "images/",
            showNavigator: true,
            navigationControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
	    zoomPerClick: 1.5,
            maxZoomPixelRatio: 8,
            showNavigationControl: true,
            navigatorId: 'navigatorDiv',
            zoomInButton: "zoom_in_button",
            zoomOutButton: "zoom_out_button",
            homeButton: "home_button"
	  });

      viewer.addHandler("open", addOverlays);
      viewer.clearControls();
      viewer.open("<?php print_r($config['fastcgi_server']); ?>?DeepZoom=" + fileLocation);
      var imagingHelper = new OpenSeadragonImaging.ImagingHelper({viewer: viewer});
      viewer.scalebar({
          type: OpenSeadragon.ScalebarType.MAP,
          pixelsPerMeter: (1 / (parseFloat(this.MPP["mpp-x"]) * 0.000001)),
          xOffset: 5,
          yOffset: 10,
          stayInsideImage: true,
          color: "rgb(150,150,150)",
          fontColor: "rgb(100,100,100)",
          backgroundColor: "rgba(255,255,255,0.5)",
          barThickness: 2
      });

      function addOverlays() {
          var annotationHandler = new AnnotoolsOpenSeadragonHandler(viewer);

          annotool = new annotools({
              left: '0px',
              top: '4.75%',
              height: '30px',
              width: '100%',
              canvas: 'openseadragon-canvas',
              iid: tissueId,
              viewer: viewer,
              annotationHandler: annotationHandler,
              mpp: MPP,
              navigator: 'navigatorDiv',
              editButton: 'edit_button',
              toggleButton: 'toggle_button',
              showNavigatorButton: 'show_navigator_button'
          });

          annoteditor = new annoteditor("tool", annotool, {
              measureButton: "measure_button"
          });

          annotool.annoteditor = annoteditor;
      }

      if (!String.prototype.format) {
          String.prototype.format = function() {
              var args = arguments;
              return this.replace(/{(\d+)}/g, function(match, number) {
                  return typeof args[number] != 'undefined' ? args[number] : match;
              });
          };
      }
     </script>


</body>
</html>

