var annoteditor = new Class({
    initialize: function(element, annotool, options) {
        this.initialized = false;
        this.top = options.top || '5%';
        this.color = options.color || 'lime'; //Default Annotation Color
        this.zindex = options.zindex || '100'; //To Make Sure The Tool Appears in the Front
        this.iidDecoded = decodeURI(options.iid);
        this.canvas = options.canvas; //The canvas Element that The Use will be drawing annotatoins on.
        //this.iid = options.iid || null; //The Image ID
        //this.annotVisible = true; //The Annotations are Set to be visible at the First Loading
        this.annotool = annotool;
        this.annotationActive = this.annotool.annotationActive;
        this.drawShape = 'default'; //The Mode is Set to Default
        this.measureButton = document.id(options.measureButton);
        this.source = element;
        this.viewer = options.viewer;
        this.imagingHelper = this.annotool.viewer.imagingHelper;
        this.mpp = options.mpp;
        this.mppx = annotool.mppx;
        this.mppy = annotool.mppy;
        this.x1 = 0.0;
        this.x2 = 1.0;
        this.y1 = 0.0;
        this.y2 = 1.0;
        this.annotationHandler = this.annotool.annotationHandler || new AnnotoolsOpenSeadragonHandler();
        this.drawLayer = new Element('div', {
            html: "",
            styles: {
                position: 'absolute',
                'z-index': 1
            }
        }).inject(document.body); //drawLayer will hide by default
        this.drawLayer.hide();
        this.drawCanvas = new Element('canvas').inject(this.drawLayer);
        window.addEvent("domready", function() {
            this.createButtons();
        }.bind(this)); //Get the annotation information and Create Buttons
        this.tool.setStyles({
            'visibility': 'hidden'
        });
    },

    createButtons: function() {
        this.tool = document.id(this.source); //Get The Element with the Source ID.
        this.tool.setStyles({
            'position': 'absolute',
            'left': this.left,
            'top': this.top,
            'width': this.width,
            'height': this.height,
            'z-index': this.zindex
        });
        this.tool.addClass('annotbuttons'); //Update Styles
        //this.tool.makeDraggable(); //Make it Draggable.
        if (this.annotationActive) {
            this.rectbutton = new Element('img', {
                'title': 'Draw Rectangle (r)',
                'class': 'toolButton firstToolButtonSpace',
                'src': 'images/rect.svg'
            }).inject(this.tool); //Create Rectangle Tool
            this.ellipsebutton = new Element('img', {
                'title': 'Draw Circle (c)',
                'class': 'toolButton',
                'src': 'images/ellipse.svg'
            }).inject(this.tool); //Ellipse Tool
            this.polybutton = new Element('img', {
                'title': 'Draw Polygon (p)',
                'class': 'toolButton',
                'src': 'images/poly.svg'
            }).inject(this.tool); //Polygon Tool
            this.pencilbutton = new Element('img', {
                'title': 'Draw Freeline (f)',
                'class': 'toolButton',
                'src': 'images/pencil.svg'
            }).inject(this.tool); //Pencil Tool
            this.filterbutton = new Element('img', {
                'title': 'Filter Markups',
                'class': 'toolButton',
                'src': 'images/filter.svg'
            }).inject(this.tool); //Filter Button
            this.analyzebutton = new Element('img', {
                'title': 'Analyze',
                'class': 'toolButton firstToolButtonSpace',
                'src': 'images/rect.svg'
            }).inject(this.tool); //Analysis Tool
        }
        /*this.titleButton = new Element('<p>', {
            'class': 'titleButton',
            'text': 'caMicroscope'
        }).inject(this.tool);

        this.iidbutton = new Element('<p>', {
            'class': 'iidButton',
            'text': 'SubjectID :' + this.iid
        }).inject(this.tool);*/
        if (this.annotationActive) {
            this.rectbutton.addEvents({
                'click': function() {
                    this.drawShape = 'rect';
                    this.drawMarkups();
                }.bind(this)
            }); //Change Mode
            this.ellipsebutton.addEvents({
                'click': function() {
                    this.drawShape = 'ellipse';
                    this.drawMarkups();
                }.bind(this)
            });
            this.polybutton.addEvents({
                'click': function() {
                    this.drawShape = 'polyline';
                    this.drawMarkups();
                }.bind(this)
            });
            this.pencilbutton.addEvents({
                'click': function() {
                    this.drawShape = 'pencil';
                    this.drawMarkups();
                }.bind(this)
            });
            this.filterbutton.addEvents({
                'click': function() {
                    this.removeMouseEvents();
                    this.promptForAnnotation(null, "filter", this, null);
                }.bind(this)
            });
            this.analyzebutton.addEvents({
                'click': function() {
                    this.analyze()
                }.bind(this)
            });
            var toolButtons = document.getElements(".toolButton");
            for (var i = 0; i < toolButtons.length; i++) {
                toolButtons[i].addEvents({
                    'mouseenter': function() {
                        this.addClass('selected')
                    },
                    'mouseleave': function() {
                        this.removeClass('selected')
                    }
                });
            }
            this.messageBox = new Element('div', {
                'id': 'messageBox'
            }).inject(document.body); //Create A Message Box
        }
        this.measureButton.addEvents({
            'click': function() {
                this.drawShape = 'measure';
                this.drawMarkups();
            }.bind(this)
        });
    },

    drawMarkups: function() {
        this.annotool.showMessage(); //Show Message
        this.drawCanvas.removeEvents('mouseup');
        this.drawCanvas.removeEvents('mousedown');
        this.drawCanvas.removeEvents('mousemove');
        this.drawLayer.show(); //Show The Drawing Layer
        //this.magnifyGlass.hide(); //Hide The Magnifying Tool
        //this.container = document.id(this.canvas); //Get The Canvas Container
        this.container = document.getElementsByClassName(this.annotool.canvas)[0]; //Get The Canvas Container
        //this.container = document.getElementById('container'); //Get The Canvas Container
        if (this.container) {
            //var left = parseInt(this.container.offsetLeft), //Get The Container Location
            var left = parseInt(this.container.getLeft()), //Get The Container Location
                top = parseInt(this.container.offsetTop),
                width = parseInt(this.container.offsetWidth),
                height = parseInt(this.container.offsetHeight);
                //oleft = left,
                //otop = this.annotool.top,
                //owidth = width,
                //oheight = height;
            //console.log("left: " + left + " top: " + top + " width: " + width + " height: " + height);
            if (left < 0) {
                left = 0;
                width = window.innerWidth;
            } //See Whether The Container is outside The Current ViewPort
            if (top < 0) {
                top = 0;
                height = window.innerHeight;
            }
            //Recreate The CreateAnnotation Layer Because of The ViewPort Change Issue.
            this.drawLayer.set({
                'styles': {
                    left: left,
                    top: this.annotool.top,
                    width: width,
                    height: height
                }
            });
            //Create Canvas on the CreateAnnotation Layer
            this.drawCanvas.set({
                top: this.annotool.top,
                width: width,
                height: height
            });
            //The canvas context
            var ctx = this.drawCanvas.getContext("2d");
            //Draw Markups on Canvas
            switch (this.drawShape) {
                case "rect":
                    this.drawRectangle(ctx);
                    break;
                case "ellipse":
                    this.drawEllipse(ctx);
                    break;
                case "pencil":
                    this.drawPencil(ctx);
                    break;
                case "polyline":
                    this.drawPolyline(ctx);
                    break;
                case "measure":
                    this.drawMeasure(ctx);
                    break;
            }
        } else this.annotool.showMessage("Container Not SET Correctly Or Not Fully Loaded Yet");
    },

    addnewAnnot: function(newAnnot) {
        newAnnot.iid = this.annotool.iidDecoded;
        newAnnot.annotId = MD5(new Date().toString());
        this.annotool.annotations.push(newAnnot);
        this.saveAnnot();
    },

    drawEllipse: function(ctx) {
        this.removeMouseEvents();
        var started = false;
        var min_x, min_y, max_x, max_y, w, h;
        var startPosition;
        var startRelativePosition;
        this.drawCanvas.addEvent('mousedown', function(e) {
            started = true;
            startPosition = OpenSeadragon.getMousePosition(e.event);
            startRelativePosition = startPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
        });

        this.drawCanvas.addEvent('mousemove', function(e) {
            if (started) {
                ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
                var currentPosition = OpenSeadragon.getMousePosition(e.event);
                var currentRelativePosition = currentPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));

                min_x = Math.min(currentRelativePosition.x, startRelativePosition.x);
                min_y = Math.min(currentRelativePosition.y, startRelativePosition.y);
                max_x = Math.max(currentRelativePosition.x, startRelativePosition.x);
                max_y = Math.max(currentRelativePosition.y, startRelativePosition.y);
                w = Math.abs(max_x - min_x);
                h = Math.abs(max_y - min_y);

                var kappa = .5522848;
                var ox = (w / 2) * kappa;
                var oy = (h / 2) * kappa;
                var xe = min_x + w;
                var ye = min_y + h;
                var xm = min_x + w / 2;
                var ym = min_y + h / 2;

                ctx.beginPath();
                ctx.moveTo(min_x, ym);
                ctx.bezierCurveTo(min_x, ym - oy, xm - ox, min_y, xm, min_y);
                ctx.bezierCurveTo(xm + ox, min_y, xe, ym - oy, xe, ym);
                ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                ctx.bezierCurveTo(xm - ox, ye, min_x, ym + oy, min_x, ym);
                ctx.closePath();
                ctx.strokeStyle = this.color;
                ctx.stroke();

            }
        }.bind(this));

        this.drawCanvas.addEvent('mouseup', function(e) {
            started = false;
            var finalPosition = new OpenSeadragon.getMousePosition(e.event);
            var finalRelativePosition = finalPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
            min_x = Math.min(finalRelativePosition.x, startRelativePosition.x);
            min_y = Math.min(finalRelativePosition.y, startRelativePosition.y);
            max_x = Math.max(finalRelativePosition.x, startRelativePosition.x);
            max_y = Math.max(finalRelativePosition.y, startRelativePosition.y);

            var newAnnot = {
                x: min_x,
                y: min_y,
                w: Math.abs(max_x - min_x),
                h: Math.abs(max_y - min_y),
                type: "ellipse",
                color: this.color,
                loc: new Array()
            };

            var globalNumbers = JSON.parse(this.convertFromNative(newAnnot, finalRelativePosition));

            newAnnot.x = globalNumbers.nativeX;
            newAnnot.y = globalNumbers.nativeY;
            newAnnot.w = globalNumbers.nativeW;
            newAnnot.h = globalNumbers.nativeH;
            var loc = new Array();
            loc[0] = parseFloat(newAnnot.x);
            loc[1] = parseFloat(newAnnot.y);
            newAnnot.loc = loc;
            this.promptForAnnotation(newAnnot, "new", this, ctx);
        }.bind(this));
    },
    drawRectangle: function(ctx) {
        this.removeMouseEvents();
        var started = false;
        var min_x, min_y, max_x, max_y, w, h;
        var startPosition;
        var startRelativePosition;
        this.drawCanvas.addEvent('mousedown', function(e) {
            started = true;
            startPosition = OpenSeadragon.getMousePosition(e.event);
            startRelativePosition = startPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
        });

        this.drawCanvas.addEvent('mousemove', function(e) {
            if (started) {
                ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
                var currentMousePosition = OpenSeadragon.getMousePosition(e.event);
                var currentRelativePosition = currentMousePosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));

                min_x = Math.min(currentRelativePosition.x, startRelativePosition.x);
                min_y = Math.min(currentRelativePosition.y, startRelativePosition.y);
                max_x = Math.max(currentRelativePosition.x, startRelativePosition.x);
                max_y = Math.max(currentRelativePosition.y, startRelativePosition.y);
                w = Math.abs(max_x - min_x);
                h = Math.abs(max_y - min_y);
                ctx.strokeStyle = this.color;
                ctx.strokeRect(min_x, min_y, w, h);
            }
        }.bind(this));

        this.drawCanvas.addEvent('mouseup', function(e) {
            started = false;
            var finalMousePosition = new OpenSeadragon.getMousePosition(e.event);
            var finalRelativePosition = finalMousePosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));

            min_x = Math.min(finalRelativePosition.x, startRelativePosition.x);
            min_y = Math.min(finalRelativePosition.y, startRelativePosition.y);
            max_x = Math.max(finalRelativePosition.x, startRelativePosition.x);
            max_y = Math.max(finalRelativePosition.y, startRelativePosition.y);

            var newAnnot = {
                x: min_x,
                y: min_y,
                w: Math.abs(max_x - min_x),
                h: Math.abs(max_y - min_y),
                type: "rect",
                color: this.color,
                loc: new Array()
            };

            var globalNumbers = JSON.parse(this.convertFromNative(newAnnot, finalRelativePosition));

            newAnnot.x = globalNumbers.nativeX;
            newAnnot.y = globalNumbers.nativeY;
            newAnnot.w = globalNumbers.nativeW;
            newAnnot.h = globalNumbers.nativeH;
            var loc = new Array();
            loc[0] = parseFloat(newAnnot.x);
            loc[1] = parseFloat(newAnnot.y);
            newAnnot.loc = loc;
            this.promptForAnnotation(newAnnot, "new", this, ctx);
        }.bind(this));
    },
    drawPencil: function(ctx) {
        this.removeMouseEvents();
        var started = false;
        var pencil = [];
        var newpoly = [];
        this.drawCanvas.addEvent('mousedown', function(e) {
            started = true;
            var startPoint = OpenSeadragon.getMousePosition(e.event);
            var relativeStartPoint = startPoint.minus(OpenSeadragon.getElementOffset(viewer.canvas));
            newpoly.push({
                "x": relativeStartPoint.x,
                "y": relativeStartPoint.y
            });
            ctx.beginPath();
            ctx.moveTo(relativeStartPoint.x, relativeStartPoint.y)
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }.bind(this));

        this.drawCanvas.addEvent('mousemove', function(e) {
            var newPoint = OpenSeadragon.getMousePosition(e.event);
            var newRelativePoint = newPoint.minus(OpenSeadragon.getElementOffset(viewer.canvas));
            if (started) {
                newpoly.push({
                    "x": newRelativePoint.x,
                    "y": newRelativePoint.y
                });

                ctx.lineTo(newRelativePoint.x, newRelativePoint.y);
                ctx.stroke();
            }
        });

        this.drawCanvas.addEvent('mouseup', function(e) {
            started = false;
            pencil.push(newpoly);
            newpoly = [];
            numpoint = 0;
            var x, y, w, h;
            x = pencil[0][0].x;
            y = pencil[0][0].y;

            var maxdistance = 0;
            var points = "";
            var endRelativeMousePosition;
            for (var i = 0; i < pencil.length; i++) {
                newpoly = pencil[i];
                for (j = 0; j < newpoly.length - 1; j++) {
                    points += newpoly[j].x + ',' + newpoly[j].y + ' ';
                    if (((newpoly[j].x - x) * (newpoly[j].x - x) + (newpoly[j].y - y) * (newpoly[j].y - y)) > maxdistance) {
                        maxdistance = ((newpoly[j].x - x) * (newpoly[j].x - x) + (newpoly[j].y - y) * (newpoly[j].y - y));
                        var endMousePosition = new OpenSeadragon.Point(newpoly[j].x, newpoly[j].y);
                        endRelativeMousePosition = endMousePosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
                    }
                }

                points = points.slice(0, -1);
                points += ';';
            }

            points = points.slice(0, -1);

            var newAnnot = {
                x: x,
                y: y,
                w: w,
                h: h,
                type: 'pencil',
                points: points,
                color: this.color,
                loc: new Array()
            };

            var globalNumbers = JSON.parse(this.convertFromNative(newAnnot, endRelativeMousePosition));
            newAnnot.x = globalNumbers.nativeX;
            newAnnot.y = globalNumbers.nativeY;
            newAnnot.w = globalNumbers.nativeW;
            newAnnot.h = globalNumbers.nativeH;
            newAnnot.points = globalNumbers.points;
            var loc = new Array();
            loc[0] = parseFloat(newAnnot.x);
            loc[1] = parseFloat(newAnnot.y);
            newAnnot.loc = loc;
            this.promptForAnnotation(newAnnot, "new", this, ctx);
        }.bind(this));
    },

    drawMeasure: function(ctx) {
        this.removeMouseEvents();
        var started = false;
        var length;
        var startRelativePosition;

        this.drawCanvas.addEvent('mousedown', function(e) {
            if (!started) {
                var startPosition = OpenSeadragon.getMousePosition(e.event);
                startRelativePosition = startPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
                started = true;
            } else {
                var endPosition = OpenSeadragon.getMousePosition(e.event);
                var endRelativePosition = endPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));
                ctx.beginPath();
                ctx.moveTo(startRelativePosition.x, startRelativePosition.y);
                ctx.lineTo(endRelativePosition.x, endRelativePosition.y);
                ctx.strokeStyle = this.color;
                ctx.stroke();

                var x_dist = ((this.imagingHelper.physicalToDataX(startRelativePosition.x)) - (this.imagingHelper.physicalToDataX(startRelativePosition.y)));
                var y_dist = ((this.imagingHelper.physicalToDataY(endRelativePosition.x)) - (this.imagingHelper.physicalToDataY(endRelativePosition.y)));

                var x_micron = this.mppx * x_dist;
                var y_micron = this.mppy * y_dist;

                var length = Math.sqrt(x_micron.pow(2) + y_micron.pow(2));
                var newAnnot = {
                    x: startRelativePosition.x,
                    y: startRelativePosition.y,
                    w: Math.abs(endRelativePosition.x - startRelativePosition.x),
                    h: Math.abs(endRelativePosition.y - startRelativePosition.y),
                    type: "line",
                    points: (endRelativePosition.x + "," + endRelativePosition.y),
                    color: this.color,
                    loc: new Array(),
                    length: length
                };

                var globalNumbers = JSON.parse(this.convertFromNative(newAnnot, endRelativePosition));
                newAnnot.x = globalNumbers.nativeX;
                newAnnot.y = globalNumbers.nativeY;
                newAnnot.w = globalNumbers.nativeW;
                newAnnot.h = globalNumbers.nativeH;
                newAnnot.points = globalNumbers.points;
                var loc = new Array();
                loc[0] = parseFloat(newAnnot.x);
                loc[1] = parseFloat(newAnnot.y);
                newAnnot.loc = loc;
                this.promptForAnnotation(newAnnot, "new", this, ctx);
                started = false;
            }
        }.bind(this));

        this.drawCanvas.addEvent('mousemove', function(e) {
            if (started) {
                ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
                var currentPosition = OpenSeadragon.getMousePosition(e.event);
                var currentRelativePosition = currentPosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));

                ctx.beginPath();
                ctx.moveTo(startRelativePosition.x, startRelativePosition.y);
                ctx.lineTo(currentRelativePosition.x, currentRelativePosition.y);
                ctx.strokeStyle = this.color;
                ctx.stroke();
                ctx.closePath();
            }
        }.bind(this));
    },

    drawPolyline: function(ctx) {
        this.removeMouseEvents();
        var started = true;
        var newpoly = [];
        var numpoint = 0;
        this.drawCanvas.addEvent('mousedown', function(e) {
            if (started) {
                var newPoint = OpenSeadragon.getMousePosition(e.event);
                var newRelativePoint = newPoint.minus(OpenSeadragon.getElementOffset(viewer.canvas));
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(e.event.layerX, e.event.layerY, 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill;
                newpoly.push({
                    "x": newRelativePoint.x,
                    "y": newRelativePoint.y
                });

                if (numpoint > 0) {
                    ctx.beginPath();
                    ctx.moveTo(newpoly[numpoint].x, newpoly[numpoint].y);
                    ctx.lineTo(newpoly[numpoint - 1].x, newpoly[numpoint - 1].y);
                    ctx.strokeStyle = this.color;
                    ctx.stroke();
                }

                numpoint++;
            }
        }.bind(this));

        this.drawCanvas.addEvent('dblclick', function(e) {
            started = false;
            ctx.beginPath();
            ctx.moveTo(newpoly[numpoint - 1].x, newpoly[numpoint - 1].y);
            ctx.lineTo(newpoly[0].x, newpoly[0].y);
            ctx.stroke();
            var x, y, w, h;

            x = newpoly[0].x;
            y = newpoly[0].y;

            var maxdistance = 0;

            //var tip = prompt("Please Enter Some Description","");

            var points = "";

            var endMousePosition;
            for (var i = 0; i < numpoint - 1; i++) {
                points += newpoly[i].x + ',' + newpoly[i].y + ' ';
                if (((newpoly[i].x - x) * (newpoly[i].x - x) + (newpoly[i].y - y) * (newpoly[i].y - y)) > maxdistance) {
                    maxdistance = ((newpoly[i].x - x) * (newpoly[i].x - x) + (newpoly[i].y - y) * (newpoly[i].y - y));

                    endMousePosition = new OpenSeadragon.Point(newpoly[i].x, newpoly[i].y);
                    w = Math.abs(newpoly[i].x - x);
                    h = Math.abs(newpoly[i].y - y);
                }
            }

            points += newpoly[i].x + ',' + newpoly[i].y;

            var endRelativeMousePosition = endMousePosition.minus(OpenSeadragon.getElementOffset(viewer.canvas));

            var newAnnot = {
                x: x,
                y: y,
                w: w,
                h: h,
                type: 'polyline',
                points: points,
                color: this.color,
                loc: new Array()
            };

            var globalNumbers = JSON.parse(this.convertFromNative(newAnnot, endRelativeMousePosition));

            newAnnot.x = globalNumbers.nativeX;
            newAnnot.y = globalNumbers.nativeY;
            newAnnot.w = globalNumbers.nativeW;
            newAnnot.h = globalNumbers.nativeH;
            newAnnot.points = globalNumbers.points;
            var loc = new Array();
            loc[0] = newAnnot.x;
            loc[1] = newAnnot.y;
            newAnnot.loc = loc;
            this.promptForAnnotation(newAnnot, "new", this, ctx);
        }.bind(this));
    },

    convertFromNative: function(annot, end) {
        if (annot.type == "rect" || annot.type == "ellipse") {
            var x = annot.x;
            var y = annot.y;
            var w = annot.w;
            var h = annot.h;
            var x_end = end.x;
            var y_end = end.y;

            var nativeX_end = this.imagingHelper.physicalToLogicalX(x_end);
            var nativeY_end = this.imagingHelper.physicalToLogicalY(y_end);
            var nativeX = this.imagingHelper.physicalToLogicalX(x);
            var nativeY = this.imagingHelper.physicalToLogicalY(y);
            var nativeW = nativeX_end - nativeX;
            var nativeH = nativeY_end - nativeY;

            var globalNumber = JSON.encode({
                nativeW: nativeW,
                nativeH: nativeH,
                nativeX: nativeX,
                nativeY: nativeY
            });

            return globalNumber;
        } else if (annot.type == "polyline" || annot.type == "pencil" || annot.type == "line") {
            var x = annot.x;
            var y = annot.y;
            var w = annot.w;
            var h = annot.h;
            var point = annot.points;
            var poly_first_split = String.split(point, ' ');
            var points = "";
            for (var k = 0; k < poly_first_split.length - 1; k++) {
                var poly_second_split = String.split(poly_first_split[k], ',');
                var polyPoint = new OpenSeadragon.Point(parseFloat(poly_second_split[0]), parseFloat(poly_second_split[1]));
                points += this.imagingHelper.physicalToLogicalX(polyPoint.x) + ',' + this.imagingHelper.physicalToLogicalY(polyPoint.y) + ' ';
            }
            var last_poly_split = String.split(poly_first_split[k], ',');
            var lastPolyPoint = new OpenSeadragon.Point(parseFloat(last_poly_split[0]), parseFloat(last_poly_split[1]));
            points += this.imagingHelper.physicalToLogicalX(lastPolyPoint.x) + ',' + this.imagingHelper.physicalToLogicalY(lastPolyPoint.y);
            
            var x_end = end.x;
            var y_end = end.y;
            var nativeX_end = this.imagingHelper.physicalToLogicalX(x_end);
            var nativeY_end = this.imagingHelper.physicalToLogicalY(y_end);
            var nativeX = this.imagingHelper.physicalToLogicalX(x);
            var nativeY = this.imagingHelper.physicalToLogicalY(y);
            var nativeW = nativeX_end - nativeX;
            var nativeH = nativeY_end - nativeY;
            var nativePoints = points;

            var globalNumber = JSON.encode({
                nativeW: nativeW,
                nativeH: nativeH,
                nativeX: nativeX,
                nativeY: nativeY,
                points: nativePoints
            });

            return globalNumber;
        } else
            return JSON.encode(annot);
    },

    editTip: function(id) //Edit Tips
        {
            this.removeMouseEvents();
            var annoteditor = this;
            var annotation = this.annotool.annotations[id];
            var annotationTextJson = annotation.text;
            var content = "";
            for (var key in annotationTextJson) {
                content += "<p class='labelText'>" + key + ": " + annotationTextJson[key] + "</p>";
            }
            content += "<p class='labelText'>Created by: " + this.annotool.annotations[id].username + "</p>";
            var SM = new SimpleModal();
            SM.addButton("Edit Annotation", "btn primary", function() {
                annoteditor.promptForAnnotation(annotation, "edit", annoteditor, null);
            });
            SM.addButton("Edit Markup", "btn primary", function() {
                annoteditor.addMouseEvents();
                this.hide();
            });
            SM.addButton("Delete", "btn primary", function() {
                var NSM = new SimpleModal();
                NSM.addButton("Confirm", "btn primary", function() {
                    annoteditor.deleteAnnot(id);
                    annoteditor.addMouseEvents();
                    this.hide();
                });
                NSM.addButton("Cancel", "btn cancel", function() {
                    annoteditor.addMouseEvents();
                    this.hide();
                });
                NSM.show({
                    "model": "modal",
                    "title": "Confirm deletion",
                    "contents": "Are you sure you want to delete this annotation?"
                });
            });
            SM.addButton("Cancel", "btn secondary", function() {
                annoteditor.addMouseEvents();
                this.hide();
            });
            SM.show({
                "model": "modal",
                "title": "EditAnnotation",
                "contents": content
            });
        },
    deleteAnnot: function(id) //Delete Annotations
        {
            var testAnnotId = this.annotool.annotations[id].annotId;
            this.annotool.annotations.splice(id, 1);
            //########### Do the delete using bindaas instead of on local list.
            if (this.annotool.iid) {
                var jsonRequest = new Request.JSON({
                    url: 'api/Data/deleteAnnot.php',
                    async: false,
                    onSuccess: function(e) {
                        this.annotool.showMessage("deleted from server");
                    }.bind(this),
                    onFailure: function(e) {
                        this.annotool.showMessage("Error deleting the Annotations, please check your deleteAnnot php");
                    }.bind(this)
                }).get({
                    'annotId': testAnnotId
                });
            }
            this.annotool.displayAnnot();
        },
    updateAnnot: function(annot) //Save Annotations
        {
            var jsonRequest = new Request.JSON({
                url: 'api/Data/updateAnnot.php',
                onSuccess: function(e) {
                    this.annotool.showMessage("saved to the server");
                }.bind(this),
                onFailure: function(e) {
                    this.annotool.showMessage("Error Saving the Annotations,please check you saveAnnot funciton");
                }.bind(this)
            }).post({
                'iid': this.iid,
                'annot': annot
            });
            this.displayAnnot();
        },
    saveAnnot: function() //Save Annotations
        {
            var jsonRequest = new Request.JSON({
                url: 'api/Data/getAnnotSpatial.php',
                async: false,
                onSuccess: function(e) {
                    this.annotool.showMessage("saved to the server");
                }.bind(this),
                onFailure: function(e) {
                    this.annotool.showMessage("Error Saving the Annotations,please check you saveAnnot funciton");
                }.bind(this)
            }).post({
                'iid': this.annotool.iid,
                'annot': this.annotool.annotations
            });
        },

    retrieveTemplate: function() {
        var jsonReturn = "";
        var jsonRequest = new Request.JSON({
            url: 'api/Data/retrieveTemplate.php',
            async: false,
            onSuccess: function(e) {
                jsonReturn = JSON.parse(e)[0];
            }.bind(this),
            onFailure: function(e) {
                this.annotool.showMessage("Error retrieving AnnotationTemplate, please check your retrieveTemplate.php");
            }.bind(this)
        }).get();

        return jsonReturn;
    },
    retrieveSingleAnnot: function(annotId) {
        var jsonReturn;
        var jsonRequest = new Request.JSON({
            url: 'api/Data/retrieveSingleAnnot.php',
            async: false,
            onSuccess: function(e) {
                jsonReturn = JSON.parse(e)[0];
            }.bind(this),
            onFailure: function(e) {
                this.annotool.showMessage("Error retrieving Annotation, please check your trieveSingleAnnot.php");
            }.bind(this)
        }).get({
            'annotId': annotId
        });

        return jsonReturn;
    },
    populateForm: function(annotationTemplateJson, annotationTextJson, mode) {
        var form = "";
        for (var key in annotationTemplateJson) {
            if (annotationTemplateJson.hasOwnProperty(key) && key != "_id") {
                form += "<p class='labelText'>" + key + ": </p>";
                var val = annotationTemplateJson[key];
                if (val == "text") {
                    form += "<input type='text' size='45' name='" + key + "' id='" + key + "'";
                    if (mode == "edit") {
                        form += " value='" + annotationTextJson[key] + "'";
                    }
                    form += "\><br \>";
                } else {
                    var options = val['enumerable'].replace(/ /g, "").split(",");
                    if (val['multi'] == "true" && mode != "filter") {
                        for (var i = 0; i < options.length; i++) {
                            form += "<input type='checkbox' name='" + key + "' id='" + options[i] + "' value='" + options[i] + "'";
                            if (mode == "edit" && annotationTextJson[key].indexOf(options[i]) != -1) {
                                form += " checked='true'";
                            }
                            form += ">" + options[i] + "</input>";
                        }
                    } else {
                        for (var i = 0; i < options.length; i++) {
                            form += "<input type='radio' name='" + key + "' id='" + options[i] + "' value='" + options[i] + "'";
                            if (mode == "edit" && annotationTextJson[key] == options[i]) {
                                form += " checked='true'";
                            }
                            form += ">" + options[i] + "</input>";
                        }
                    }
                }
            }
        }
        return form;
    },
    promptForAnnotation: function(newAnnot, mode, annoteditor, ctx) {
        this.drawCanvas.removeEvents("mousedown");
        var form = "<form id='annotationForm'>";
        if (mode == "new" && newAnnot.type == "line") {
            form += "<p class='annotationLabel'>Length: " + newAnnot.length + " um</p>";
        } else {
            var annotationTemplateJson = annoteditor.retrieveTemplate();
            if (mode == "edit") {
                var id = newAnnot.id;
                newAnnot = annoteditor.retrieveSingleAnnot(newAnnot.annotId);
                newAnnot.id = id;
            }
            var annotationTextJson = (mode == "edit") ? newAnnot.text : null;
            form += annoteditor.populateForm(annotationTemplateJson, annotationTextJson, mode);
        }
        form += "</form>";
        var field = [];
        var submission = "";
        if (mode == "new" || mode == "edit") {
            submission = "{ ";
        }
        if (newAnnot.type != "line") {
            for (var key in annotationTemplateJson) {
                if (annotationTemplateJson.hasOwnProperty(key) && key != "_id") {
                    field.push(key);
                    if (mode == "new" || mode == "edit") {
                        submission += "\"" + key + "\" : ";
                        submission += "__" + key + "__, ";
                    } else {
                        submission += key + "=" + "__" + key + "__" + "&";
                    }
                }
            }
        }
        if (mode == "new" || mode == "edit") {
            submission = submission.substring(0, submission.length - 2) + " }";
        } else {
            submission = submission.substring(0, submission.length - 1);
        }
        var title;
        switch (mode) {
            case "new":
                if (newAnnot.type == "line") {
                    title = "Measured Length";
                } else {
                    title = "Enter a new annotation:";
                }
                break;
            case "edit":
                title = "Edit annotation";
                break;
            case "filter":
                title = "Filter annotations by:";
                break;
        }
        var SM = new SimpleModal();
        var confirmButton = (mode == "new" && newAnnot.type == "line") ? "Save" : "Confirm";
        SM.addButton(confirmButton, "btn primary", function() {
            if (mode == "edit") {
                annoteditor.deleteAnnot(newAnnot.id);
                delete newAnnot.id;
            }
            if (mode == "new" && newAnnot.type == "line") {
                submission = "{ \"Length\" : \"" + newAnnot.length + " um\" }";
                var readyToSubmit = true;
            } else {
                var text = '{"text" : [';
                var fieldReplacement = [];
                var fieldName = [];
                var readyToSubmit = true;
                for (var i = 0; i < field.length; i++) {
                    var fieldElem = $$(document.getElementsByName(field[i]));
                    fieldName[i] = field[i];
                    var value = "";
                    var hasValue = false;
                    if (fieldElem[0].type == "text") {
                        value = $(field[i]).value
                        if (value != "") {
                            hasValue = true;
                            var replacement = "\"" + value + "\"";
                        }
                    } else if (fieldElem[0].type == "checkbox") {
                        var replacement = "[ ";
                        for (var j = 0; j < fieldElem.length; j++) {
                            if (fieldElem[j].checked) {
                                replacement += "\"" + fieldElem[j].value + "\" , ";
                                value = fieldElem[j].value;
                                hasValue = true;
                            }
                        }
                        replacement = replacement.substring(0, replacement.length - 2) + "]";
                    } else if (fieldElem[0].type == "radio") {
                        var replacement = "\"";
                        for (var j = 0; j < fieldElem.length; j++) {
                            if (fieldElem[j].checked) {
                                replacement += fieldElem[j].value + "\"";
                                value = fieldElem[j].value;
                                hasValue = true;
                                break;
                            }
                        }
                    }
                    readyToSubmit = readyToSubmit && hasValue;
                    fieldReplacement[i] = replacement;
                    text += '{"' + field[i] + '":"' + value + '"},';
                }
                text = text.substring(0, text.length - 1);
                text += ']}';
            }
            if (readyToSubmit) {
                if (mode != "new" || newAnnot.type != "line") {
                    for (var i = 0; i < fieldName.length; i ++) {
                        submission = submission.replace("__" + fieldName[i] + "__", fieldReplacement[i]);
                    }
                }
                if (mode == "new" || mode == "edit") {
                    console.log(submission);
                    newAnnot.text = JSON.parse(submission);
                    annoteditor.addnewAnnot(newAnnot);
                    annoteditor.annotool.getAnnot();
                } else {
                    //====================================================================
                    //substitute with the new getAnnotByFilter() function when appropriate using submission as the filter statement
                    var text_obj = JSON.parse(text);
                    annoteditor.getAnnotFilter(text_obj.text[0].Author, text_obj.text[1].Grade, text_obj.text[2].Multi);
                }
                ctx.clearRect(0, 0, annoteditor.drawCanvas.width, annoteditor.drawCanvas.height);
                annoteditor.drawLayer.hide();
                annoteditor.addMouseEvents();
                this.hide();
            } else {
                alert("Please fill all items.");
            }
            return true;
        });
        SM.addButton("Cancel", "btn secondary", function() {
            //if (mode == "new") {
                ctx.clearRect(0, 0, annoteditor.drawCanvas.width, annoteditor.drawCanvas.height);
                annoteditor.drawLayer.hide();
            //}
            annoteditor.addMouseEvents();
            this.hide();
            return false;
        });
        SM.show({
            "model": "modal",
            "title": title,
            "contents": form,
        });
    },
    promptForAnalysis: function(annoteditor, analysisBox) {
        this.removeMouseEvents();
        var title = "Analysis Tool";
        var form = "<select id='algorithm'>";
        form += "<option value='canny_edge'>Canny Edge</option>";
        form += "<option value='marching_cubes'>Marching Cubes</option>";
        form += "</select>";
        var SM = new SimpleModal();
        SM.addButton("Confirm", "btn primary", function() {
            var algorithm = $('algorithm').value;
            this.hide();
            annoteditor.promptForParameters(annoteditor, analysisBox, algorithm);
        });
        SM.addButton("Cancel", "btn secondary", function() {
            annoteditor.addMouseEvents();
            this.hide();
            return false;
        });
        SM.show({
            "model": "modal",
            "title": title,
            "contents": form,
        });
    },
    promptForParameters: function(annoteditor, analysisBox, algorithm) {
        var title = "Enter the parameters";
        var form = "<form>";
        var field = [];
        var parameters = "{ ";
        /*====================test samples, will need to be retrived from API calls===============*/
        var sample = "{ \"param_1\" : \"text\" , \"param_2\" : \"text\" }";
        var sampleJson = JSON.parse(sample);
        /*===================================*/
        switch (algorithm) {
            case "canny_edge":
                for (var key in sampleJson) {
                    field.push(key);
                    form += "<p class='labelText'>" + key + "</p><input type='text' size='45' name='" + key + "' id='" + key + "'/><br />";
                    parameters += "\"" + key + "\" : ";
                    parameters += "__" + key + "__, ";
                }
                break;
            case "marching_cubes":
                for (var key in sampleJson) {
                    field.push(key);
                    form += "<p class='labelText'>" + key + "</p><input type='text' size='45' name='" + key + "' id='" + key + "'/><br />";
                    parameters += "\"" + key + "\" : ";
                    parameters += "__" + key + "__, ";
                }
                break;
        }
        form += "</form>";
        parameters = parameters.substring(0, parameters.length - 2) + " }";
        var SM = new SimpleModal();
        SM.addButton("Confirm", "btn primary", function() {
            for (var i = 0; i < field.length; i++) {
                var fieldElem = $$(document.getElementsByName(field[i]));
                var replacement = "\"" + $(field[i]).value + "\"";
                parameters = parameters.replace("__" + field[i] + "__", replacement);
            }
            var submission = "{ \"Algorithm\" : \"" + algorithm + "\", \"x\" : \"" + analysisBox.x + "\", \"y\" : \"" + analysisBox.y + "\", \"w\" : \"" + analysisBox.w + "\", \"h\" : \"" + analysisBox.h + "\", \"Parameters\" : " + parameters + " }";
            console.log(submission);
            submission = JSON.parse(submission);
            /*============after this point, submission is ready to be handed over to bindaas=========*/
            annoteditor.addMouseEvents();
            this.hide();
            return false;
        });
        SM.addButton("Cancel", "btn secondary", function() {
            annoteditor.addMouseEvents();
            this.hide();
            return false;
        });
        SM.show({
            "model": "modal",
            "title": title,
            "contents": form,
        });
    },
    
    addMouseEvents: function() {
        window.addEventListener('mousemove', this.annotationHandler.handleMouseMove, false);
        window.addEventListener('mousedown', this.annotationHandler.handleMouseDown, false);
        window.addEventListener('mouseup', this.annotationHandler.handleMouseUp, false);
    },
    removeMouseEvents: function() {
        window.removeEventListener('mousemove', this.annotationHandler.handleMouseMove, false);
        window.removeEventListener('mousedown', this.annotationHandler.handleMouseDown, false);
        window.removeEventListener('mouseup', this.annotationHandler.handleMouseUp, false);
    }
});