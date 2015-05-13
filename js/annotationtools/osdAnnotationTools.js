/*
Copyright (C) 2012 Shaohuan Li <shaohuan.li@gmail.com>, Ashish Sharma <ashish.sharma@emory.edu>
This file is part of Biomedical Image Viewer developed under the Google of Summer of Code 2012 program.
 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 
http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

var annotools = new Class({
    initialize: function(options) {
        this.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        this.isFirefox = typeof InstallTrigger !== 'undefined';
        this.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        this.isChrome = !!window.chrome;
        this.annotationActive = !(this.isFirefox || this.isIE || this.isOpera);
        //this.source = element; //The Tool Source Element
        this.left = options.left || '150px'; //The Tool Location
        this.ratio = options.ratio || 0.005; //One pixel equals to the length in real situation. Will be used in the measurement tool
        this.maxWidth = options.maxWidth || 4000; //MaxWidth of the Image
        this.maxHeight = options.maxHeight || 800; ////MaxHeight of the Image
        this.initialized = false;
        this.top = options.top || '0px';
        this.color = options.color || 'lime'; //Default Annotation Color
        this.height = options.height || '30px';
        this.width = options.width || '270px';
        this.zindex = options.zindex || '100'; //To Make Sure The Tool Appears in the Front
        this.iidDecoded = decodeURI(options.iid);
        this.canvas = options.canvas; //The canvas Element that The Use will be drawing annotatoins on.
        this.iid = options.iid || null; //The Image ID
        this.annotVisible = true; //The Annotations are Set to be visible at the First Loading

        this.viewer = options.viewer;
        this.imagingHelper = this.viewer.imagingHelper;
        this.mpp = options.mpp;
        this.mppx = parseFloat(this.mpp["mpp-x"]);
        this.mppy = parseFloat(this.mpp["mpp-y"]);
        this.x1 = 0.0;
        this.x2 = 1.0;
        this.y1 = 0.0;
        this.y2 = 1.0;

        this.navigator = document.id(options.navigator);
        this.navigator.setStyles({visibility: 'hidden'});
        this.editButton = document.id(options.editButton);
        this.toggleButton = document.id(options.toggleButton);
        this.showNavigatorButton = document.id(options.showNavigatorButton);
        this.annotationHandler = options.annotationHandler || new AnnotoolsOpenSeadragonHandler();
        this.setupHandlers();
        this.viewer.addHandler('animation-finish', function(event) {
            this.getAnnot();
        }.bind(this));
        this.messageBox = new Element('div', {
            'id': 'messageBox'
        }).inject(document.body); //Create A Message Box
        this.magnifyGlass = new Element('div', {
            'class': 'magnify'
        }).inject(document.body); //Magnify glass will hide by default
        this.magnifyGlass.hide();
        if (this.annotationActive) {
            this.getAnnot();
            this.annotations = new Array();
        }

    },

    setupNavigator: function() {
        this.navigator.setStyles({visibility: "hidden", width: "190px", height: "220px"});
    },

    getAnnot: function(viewer) {
        if (this.initialized) {
            this.x1 = this.imagingHelper._viewportOrigin["x"];
            this.y1 = this.imagingHelper._viewportOrigin["y"];
            this.x2 = this.x1 + this.imagingHelper._viewportWidth;
            this.y2 = this.y1 + this.imagingHelper._viewportHeight;
        }

        this.initialized = true;
        var jsonRequest = new Request.JSON({
            url: 'api/Data/getAnnotSpatial.php',
            onSuccess: function(e) {
                if (e != null) {
                    this.annotations = e;
                }
                this.convertAllToNative();
                this.displayAnnot(); //Display The Annotations
                //this.relativeToGlobal();
                //console.log("successfully get annotations");
            }.bind(this),
            onFailure: function(e) {
                this.showMessage("cannot get the annotations,please check your getAnnot function");
            }.bind(this)
        }).get({
            'iid': this.iid,
            'x': this.x1,
            'y': this.y1,
            'x1': this.x2,
            'y1': this.y2
        });
    },

    getAnnotFilter: function(author, grade, multi) {
        if (this.initialized) {
            this.x1 = this.imagingHelper._viewportOrigin["x"];
            this.y1 = this.imagingHelper._viewportOrigin["y"];
            this.x2 = this.x1 + this.imagingHelper._viewportWidth;
            this.y2 = this.y1 + this.imagingHelper._viewportHeight;
        }

        this.initialized = true;
        var jsonRequest = new Request.JSON({
            url: 'api/Data/getAnnotSpatialFilter.php',
            onSuccess: function(e) {
                if (e != null) {
                    this.annotations = e;
                }
                this.convertAllToNative();
                this.displayAnnot(); //Display The Annotations
                //this.relativeToGlobal();
                this.setupHandlers();
                //console.log("successfully get annotations");
            }.bind(this),
            onFailure: function(e) {
                this.showMessage("cannot get the annotations,please check your getAnnot function");
            }.bind(this)
        }).get({
            'iid': this.iid,
            'x': this.x1,
            'y': this.y1,
            'x1': this.x2,
            'y1': this.y2,
            'author': author,
            'grade': grade,
            'multi': multi
        });
    },

    magnify: function() {
        //this.drawLayer.hide();
        this.magnifyGlass.hide();
        this.magnifyGlass.set({
            html: ''
        });
        var content = new Element('div', {
            'class': "magnified_content",
            styles: {
                width: document.getSize().x,
                height: document.getSize().y
            }
        });
        content.set({
            html: document.body.innerHTML
        });
        content.inject(this.magnifyGlass);
        var scale = 2.0;
        var left = parseInt(this.magnifyGlass.style.left);
        var top = parseInt(this.magnifyGlass.style.top);
        this.magnifyGlass.set({
            'styles': {
                left: left,
                top: top
            }
        });
        content.set({
            'styles': {
                left: -scale * left,
                top: -scale * top
            }
        });
        this.magnifyGlass.show();
        this.magnifyGlass.makeDraggable({
            onDrag: function(draggable) {
                this.showMessage("drag the magnifying glass");
                var left = parseInt(this.magnifyGlass.style.left);
                var top = parseInt(this.magnifyGlass.style.top);
                this.magnifyGlass.set({
                    'styles': {
                        left: left,
                        top: top
                    }
                });
                content.set({
                    'styles': {
                        left: -scale * left,
                        top: -scale * top
                    }
                });
            }.bind(this)
        });
    },

    toggleMarkups: function() {
        if (this.svg) {
            if (this.annotVisible) {
                this.annotVisible = false;
                this.svg.hide();
                document.getElements(".annotcontainer").hide();
            } else {
                this.annotVisible = true;
                this.displayAnnot();
                document.getElements(".annotcontainer").show();
            }
        } else {
            this.annotVisible = true;
            this.displayAnnot();
        }
        this.showMessage("annotation toggled");
    },

    showMessage: function(msg) {
            this.messageBox.set({
                html: msg
            });
            var myFx = new Fx.Tween('messageBox', {
                duration: 'long',
                transition: 'bounce:out',
                link: 'cancel',
                property: 'opacity'
            }).start(0, 1).chain(function() {
                this.start(0.5, 0);
            });
    },
    
    setupHandlers: function() {
        var root = document.getElementsByTagName('svg')[0];
        if (root != undefined) {
            window.addEventListener('mousewheel', this.annotationHandler.handleMouseWheel, false); // Chrome/Safari
            this.addMouseEvents();
        }

        this.editButton.addEvents({
            'click': function() {
                document.id('tool').setStyles({
                    visibility: document.id('tool').getStyle('visibility') == 'hidden' ? 'visible' : 'hidden'
                })
            }.bind(this)
        });
        this.toggleButton.addEvents({
            'click': function() {
                this.toggleMarkups();
            }.bind(this)
        });
        this.showNavigatorButton.addEvents({
            'click': function() {
                this.navigator.setStyles({
                    visibility: this.navigator.getStyle('visibility') == 'hidden' ? 'visible' : 'hidden'
                })
            }.bind(this)
        });
    },

    displayAnnot: function() {
        var container = document.getElementsByClassName(this.canvas)[0]; //Get The Canvas Container
        if (container) {
            /*var left = parseInt(container.offsetLeft),
                top = parseInt(container.offsetTop),*/
            var width = parseInt(container.offsetWidth),
                height = parseInt(container.offsetHeight);
            //this.drawLayer.hide();
            this.magnifyGlass.hide();
            container.getElements(".annotcontainer").destroy();
            if (this.svg) {
                this.svg.html = '';
                this.svg.destroy();
            }
            //This part is for displaying SVG annotations
            if (this.annotVisible) {
                var svgHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + 'px" height="' + height + 'px" version="1.1">';
                svgHtml += '<g id="groupcenter"/>';
                svgHtml += '<g id="origin">';
                var origin = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(.5, .5));
                svgHtml += '<ellipse id="originpt" cx="' + origin.x + '" cy="' + origin.y + '" rx="' + 4 + '" ry="' + 4 + '" style="display: none"/>';
                svgHtml += '</g>';
                svgHtml += '<g id="viewport" transform="translate(0,0)">';
                var offset = OpenSeadragon.getElementOffset(viewer.canvas);
                for (var index = 0; index < this.annotations.length; index++) {
                    switch (this.annotations[index].type) {
                        case "rect":
                            var x = parseFloat(this.annotations[index].x);
                            var y = parseFloat(this.annotations[index].y);
                            var w = parseFloat(this.annotations[index].w);
                            var h = parseFloat(this.annotations[index].h);
                            // handle displaying the drawing when they are already zoomed in

                            w = this.imagingHelper.physicalToLogicalDistance(w);
                            h = this.imagingHelper.physicalToLogicalDistance(h);
                            w = w * viewer.viewport.getZoom();
                            h = h * viewer.viewport.getZoom();
                            h = h / this.imagingHelper.imgAspectRatio;

                            x = x - offset.x;
                            y = y - offset.y;
                            svgHtml += '<rect id="' + index + '" x="' + x + '" y="' + y + '" width="' + w * width + '" height="' + width * h + '" stroke="' + this.annotations[index].color + '" stroke-width="2" fill="none"/>';
                            break;
                        case "ellipse":
                            var x = parseFloat(this.annotations[index].x) - offset.x;
                            var y = parseFloat(this.annotations[index].y) - offset.y;
                            var w = parseFloat(this.annotations[index].w);
                            var h = parseFloat(this.annotations[index].h);
                            h = h / this.imagingHelper.imgAspectRatio;
                            var cx = x + w / 2;
                            var cy = y + h / 2;
                            w = this.imagingHelper.physicalToLogicalDistance(w);
                            h = this.imagingHelper.physicalToLogicalDistance(h);
                            var rx = w / 2;
                            var ry = h / 2;
                            // handle displaying the drawing when they are already zoomed in
                            rx = rx * viewer.viewport.getZoom();
                            ry = ry * viewer.viewport.getZoom();

                            svgHtml += '<ellipse id="' + index + '" cx="' + cx + '" cy="' + cy + '" rx="' + width * rx + '" ry="' + width * ry + '" style="fill:none;stroke:' + this.annotations[index].color + ';stroke-width:2"/>';
                            break;
                        case "pencil":
                            var points = this.annotations[index].points;
                            var poly = String.split(points, ';');
                            for (var k = 0; k < poly.length; k++) {
                                var p = String.split(poly[k], ' ');
                                svgHtml += '<polyline id="' + index + '" points="';
                                for (var j = 0; j < p.length; j++) {
                                    point = String.split(p[j], ',');
                                    var penPixelX = this.imagingHelper.logicalToPhysicalX(point[0]) - offset.x;
                                    var penPixelY = this.imagingHelper.logicalToPhysicalY(point[1]) - offset.y;
                                    svgHtml += penPixelX + ',' + penPixelY + ' ';
                                }
                                svgHtml += '" style="fill:none;stroke:' + this.annotations[index].color + ';stroke-width:2"/>';
                            }
                            break;
                        case "polyline":
                            var points = this.annotations[index].points;
                            var poly = String.split(points, ';');
                            var offset = OpenSeadragon.getElementOffset(viewer.canvas);
                            for (var k = 0; k < poly.length; k++) {
                                var p = String.split(poly[k], ' ');
                                svgHtml += '<polygon id="' + index + '" points="';
                                for (var j = 0; j < p.length; j++) {
                                    point = String.split(p[j], ',');
                                    var polyPixelX = this.imagingHelper.logicalToPhysicalX(point[0]) - offset.x;
                                    var polyPixelY = this.imagingHelper.logicalToPhysicalY(point[1]) - offset.y;
                                    svgHtml += polyPixelX + ',' + polyPixelY + ' ';
                                }
                                svgHtml += '" style="fill:none;stroke:' + this.annotations[index].color + ';stroke-width:2"/>';
                            }
                            break;
                        case "line":
                            var points = String.split(this.annotations[index].points, ',');
                            x1 = this.annotations[index].x - offset.x;
                            y1 = this.annotations[index].y - offset.y;
                            x2 = this.imagingHelper.logicalToPhysicalX(points[0]) - offset.x;
                            y2 = this.imagingHelper.logicalToPhysicalY(points[1]) - offset.y;
                            svgHtml += '<polygon id="' + index + '" points="' + x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x1 + ',' + y1 + ' " style="fill:none;stroke:' + this.annotations[index].color + ';stroke-width:2"/>';
                            break;
                    }

                }
            }
            svgHtml += '</g></svg>';

            this.svg = new Element("div", {
                styles: {
                    position: "absolute",
                    left: 0,
                    top: this.top,
                    width: '100%',
                    height: '100%'
                },
                html: svgHtml
            }).inject(container);
            console.log("added svg");
            var annots = $$('svg')[0].getChildren()[2];
            for (var k = 0; k < annots.getChildren().length; k++) {
                var bbox = annots.getChildren()[k].getBBox();
                var d = new Element("div", {
                    id: k,
                    "class": 'annotcontainer',
                    styles: {
                        position: 'absolute',
                        left: bbox.x,
                        top: bbox.y,
                        width: bbox.width,
                        height: bbox.height
                    }
                }).inject(container);

                var c = this;
                d.addEvents({
                    'mouseenter': function(e) {
                        e.stop;
                        c.displayTip(this.id);
                    },
                    'mouseleave': function(e) {
                        e.stop;
                        c.destroyTip();
                    },
                    'dblclick': function(e) {
                        e.stop();
                        c.annoteditor.editTip(this.id);
                    }
                });
                this.annotationHandler.originalDivCoords.push(bbox);
            }

        } else {
            this.showMessage("Canvas Container Not Ready");
        }
    },

    displayTip: function(id) {
        var container = document.getElementsByClassName(this.canvas)[0]; //Get The Canvas Container
        var width = parseInt(container.offsetWidth),
            height = parseInt(container.offsetHeight),
            annot = this.annotations[id];
        var d = new Element("div", {
            "class": 'annotip',
            styles: {
                position: 'absolute',
                left: Math.round(width * annot.x),
                top: Math.round(height * annot.y)
            },
            html: annot.text
        }).inject(container);
        this.showMessage("Double Click to Edit");
    },
    
    destroyTip: function() {
        var container = document.getElementsByClassName(this.canvas)[0]; //Get The Canvas Container
        container.getElements(".annotip").destroy();
    },

    convertToNative: function(annot) {
        if (annot.type == "rect" || annot.type == "ellipse") {
            var x = annot.x;
            var y = annot.y;
            var w = annot.w;
            var h = annot.h;

            var nativeW = this.imagingHelper.logicalToPhysicalDistance(w);
            var nativeH = this.imagingHelper.logicalToPhysicalDistance(h);
            var nativeX = this.imagingHelper.logicalToPhysicalX(x);
            var nativeY = this.imagingHelper.logicalToPhysicalY(y);
            var nativeNumbers = JSON.encode({
                nativeW: nativeW,
                nativeH: nativeH,
                nativeX: nativeX,
                nativeY: nativeY
            });
            return nativeNumbers;
        } else if (annot.type == "polyline" || annot.type == "pencil" || annot.type == "line") {
            var x = annot.x;
            var y = annot.y;
            var w = annot.w;
            var h = annot.h;
            var point = annot.points;

            var nativeW = this.imagingHelper.logicalToPhysicalDistance(w);
            var nativeH = this.imagingHelper.logicalToPhysicalDistance(h);
            var nativeX = this.imagingHelper.logicalToPhysicalX(x);
            var nativeY = this.imagingHelper.logicalToPhysicalY(y);

            var poly_first_split = String.split(point, ' ');
            var points = "";
            for (var k = 0; k < poly_first_split.length - 1; k++) {
                var poly_second_split = String.split(poly_first_split[k], ',');
                var polyPoint = new OpenSeadragon.Point(parseFloat(poly_second_split[0]), parseFloat(poly_second_split[1]));
                points += this.imagingHelper.logicalToPhysicalX(polyPoint.x) + ',' + this.imagingHelper.logicalToPhysicalY(polyPoint.y) + ' ';
            }

            var last_poly_split = String.split(poly_first_split[k], ',');
            var lastPolyPoint = new OpenSeadragon.Point(parseFloat(last_poly_split[0]), parseFloat(last_poly_split[1]));
            points += this.imagingHelper.logicalToPhysicalX(lastPolyPoint.x) + ',' + this.imagingHelper.logicalToPhysicalY(lastPolyPoint.y);

            var nativeNumbers = JSON.encode({
                nativeW: nativeW,
                nativeH: nativeH,
                nativeX: nativeX,
                nativeY: nativeY,
                nativePoints: points
            });
            return nativeNumbers;
        } else
            return JSON.encode(annot);
    },

    convertAllToNative: function() {
        for (index = 0; index < this.annotations.length; index++) {
            newannot = JSON.parse(this.convertToNative(this.annotations[index]));
            this.annotations[index].x = newannot.nativeX;
            this.annotations[index].y = newannot.nativeY;
            this.annotations[index].w = newannot.nativeW;
            this.annotations[index].h = newannot.nativeH;
        }
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