/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false, nomen: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Services */

Ext.ns('Atlas');

Atlas.MapPanel = Ext.extend(Ext.Panel, {
  cls: 'x-mappanel',

  initComponent: function() {
    this.tbar = [
    {
      id: 'zoom-in',
      icon: './images/zoom-in2.png',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      tooltip: 'Click Zoom In tool, then draw box around area of interest. Note: click the Zoom In tool again to disable this feature and return to the cursor to Pan mode.',
      toggleHandler: function(button, pressed) {
        if(pressed) {
          this.enableDragZoom();
        } else {
          this.disableDragZoom();
        }
      },
      scope: this
    },

    {
      icon: './images/full-extent2.png',
      scale: 'medium',
      tooltip: 'Click this tool to zoom to the full extent of the Province.',
      handler: function() {
        this.zoomToFullExtent();
      },
      scope: this
    },

    {
      id: 'identify',
      icon: './images/query.png',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      tooltip: 'Click on the identify tool, and then click on a feature on the map to retrieve details on the feature. The results box will list the visible layers. Click on the layer for the results.',
      toggleHandler: function(button, pressed) {
        if(pressed) {
          this.enableIdentifyTool();
        } else {
          this.disableIdentifyTool();
        }
      },
      scope: this
    },

    {
      icon: './images/search.png',
      tooltip: 'Click on the Find tool, enter a place name or water body name, and press Enter (or click on the Search symbol). The Canadian Geographical Names Database at NR Canada will be searched and the results returned by geographical type (e.g. river, lake, city, parish, etc.).',
      scale: 'medium',
      handler: this.showFindWindow,
      scope: this
    },

    {
      id: 'measure',
      icon: './images/ruler.png',
      tooltip: 'Click on the Measure tool and then click on map to begin measuring distances. Click on map to create a vertex or change direction; double click to finish. The measured distance is displayed at the top of the map (units = meters).',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      toggleHandler: function(button, pressed) {
        if(pressed) {
          this.enableMeasurement();
        } else {
          this.disableMeasurement();
        }
      },
      scope: this
    } //,

    //    {
    //      id: 'print-pdf',
    //      icon: './images/page_white_acrobat.png',
    //      tooltip: 'Export Map as PDF',
    //      scale: 'medium',
    //      handler: this.showExportPdfWindow,
    //      scope: this
    //    }
    ];

    this.bbar = [
    {
      id: 'mapInfo',
      icon: './images/world.png',
      handleMouseEvents: false,
      listeners: {
        mouseout: function() {
        //this.mapInfo.hide();
        },
        mouseover:  function() {
        //this.mapInfo.show();
        },
        scope: this
      }
    },
    {
      id: 'map-status',
      xtype: 'tbtext',
      text: 'Initializing'
    },
    '->',
    '-',
    {
      id: 'coordinates',
      xtype: 'tbtext',
      text: 'X: - Y: -'
    },
    '-',
    {
      id: 'scaleBar',
      xtype: 'tbtext',
      text: ''
    }
    ];

    Atlas.MapPanel.superclass.initComponent.call(this);
  },

  afterRender: function() {
    Atlas.MapPanel.superclass.afterRender.call(this);
    this.zoomIn          = Ext.getCmp('zoom-in');
    this.measure         = Ext.getCmp('measure');
    this.identify        = Ext.getCmp('identify');
    this.coordinates     = Ext.getCmp('coordinates');
    this.scaleBar        = Ext.getCmp('scaleBar');
    this.mapStatus       = Ext.getCmp('map-status');
    this.measurementInfo = Ext.get('measurement-length-info');
    this.mapInfo         = Ext.get('map-info');
  },

  initMapFunctionality: function(map) {
    this.map = map;

    this.map.reposition();
    this.map.resize();
    this.map.disableRubberBandZoom();
    this.map.disableShiftDoubleClickZoom();

    this.on('resize', function() {
      if(this.map) {
        this.map.reposition();
        this.map.resize();
      }
    }, this);

    this.draw = new esri.toolbars.Draw(this.map);
    dojo.connect(this.draw, "onDrawEnd", this, this.handleDraw);

    this.navigation = new esri.toolbars.Navigation(this.map);
    dojo.connect(this.navigation, "onExtentHistoryChange", this, this.handleExtentHistoryChange);
    dojo.connect(this.map, 'onExtentChange', this, function(extent, delta, levelChange, lod) {
      if(levelChange || this.scaleBar.getEl().dom.innerHTML === '') {
        this.scaleBar.getEl().dom.innerHTML = "Scale: " + Math.round(lod.scale).formatHuman();
      }
    });

    dojo.connect(this.map, 'onMouseMove', this, function(evt) {
      this.coordinates.getEl().dom.innerHTML = 'X: ' + evt.mapPoint.x.toPrecision(7) + " Y: " + evt.mapPoint.y.toPrecision(7);
    });
    dojo.connect(this.map, 'onMouseOut', this, function() {
      this.coordinates.getEl().dom.innerHTML = "X: - Y: -";
    });

    this.attachUpdateMonitor();
  },

  attachUpdateMonitor: function() {
    // for access to ext-style events, we'll need to access Atlas.esri.Map instance
    var map     = this.map.proxyOwner;
    var status  = this.mapStatus.getEl();

    map.on('beforeupdate', function() {
      status.update('Loading');
      status.show();
    });
    
    map.on('progressupdate', function(map, tilesLoaded, totalTiles) {
      var percent = Math.round(tilesLoaded / totalTiles * 100);
      if(percent >= 0 && percent <= 100) {
        status.update('Loading (' + percent + '%)');
      } else {
        status.update('Loading...');
      }
    });

    map.on('update', function() {
      status.hide();
    });
  },

  showFindWindow: function() {
    if(!this.findWindow) {
      this.findWindow = this.createFindWindow();
    }
    this.findWindow.show(this);
  },

  createFindWindow: function() {
    return new Ext.Window({
      layout: 'fit',
      width: 500,
      height: 500,
      closeAction: 'hide',
      autoScroll: true,
      title: 'Find a Place',
      items: new Atlas.FindPanel({
        border: false,
        listeners: {
          'placeclick': this.onPlaceClick,
          'placedblclick': this.onPlaceDblClick,
          scope: this
        }
      }),
      buttons: [{
        text: 'Close',
        handler: function() {
          this.findWindow.hide();
          this.map.graphics.clear();
        },
        scope: this
      }]
    });
  },

  onPlaceClick: function(place, x, y) {
    this.highlightPlace(place, x, y);
  },

  onPlaceDblClick: function(place, x, y) {
    var point  = new esri.geometry.Point(x, y, this.map.spatialReference);
    var extent = new esri.geometry.Extent(x - 0.1, y - 0.1, x + 0.1, y + 0.1, this.map.spatialReference);
    this.map.setExtent(extent, true);
    this.map.centerAt(point);
    this.highlightPlace(place, x, y);
  },

  highlightPlace: function(place, x, y) {
    this.map.graphics.clear();
    var style    = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
    var size     = 7;
    var color    = new dojo.Color([255, 0, 0, 0.6]);
    var outline  = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0, 0.8]), 1);
    var symbol   = new esri.symbol.SimpleMarkerSymbol(style, size, outline, color);
    var geometry = new esri.geometry.Point(x, y, this.map.spatialReference);
    this.map.graphics.add(new esri.Graphic(geometry, symbol));
  },

  enableDragZoom: function() {
    this.draw.activate(esri.toolbars.Draw.EXTENT);
  },

  disableDragZoom: function() {
    this.draw.deactivate();
  },

  calculateMeasurementLength: function() {
    if(!this.draw._tGraphic || !this.draw._graphic) {
      return -1;
    }

    var length = 0;
    // calculate the line segment currently being drawn
    var currentPath = this.draw._tGraphic.geometry.paths[0];
    length += this.calculateDistance(currentPath[0], currentPath[1]);

    // get the cached measurement of each fixed line segment
    Ext.each(this.draw._graphic.geometry.paths[0] , function(point, i, points) {
      var cachedLength = this.cachedMeasurements[i];
      // not cached, then calculate and cache
      if(isNaN(cachedLength)) {
        cachedLength = this.calculateDistance(points[i-1], point);
        this.cachedMeasurements[i] = cachedLength;
      }
      length += cachedLength;
    }, this);

    return length;
  },

  /*
   * p0: [x, y] array
   * p1: [x, y] array
   */
  calculateDistance: function(p0, p1) {
    // define the source projection if not already initialized
    if(!this.sourceProjection) {
      this.sourceProjection = new Proj4js.Proj('EPSG:' + this.map.spatialReference.wkid);
    }
    // define the target projection and SRS if not already initialized
    if(!this.targetProjection || !this.targetSRS) {
      // NAD83 = 2953
      this.targetProjection = new Proj4js.Proj('EPSG:2953');
      this.targetSRS = new esri.SpatialReference({ 
        "wkid": 2953
      });
    }
    // create point for transformation
    p0 = new Proj4js.Point(p0[0], p0[1]);
    p1 = new Proj4js.Point(p1[0], p1[1]);
    // do transformation
    Proj4js.transform(this.sourceProjection, this.targetProjection, p0);
    Proj4js.transform(this.sourceProjection, this.targetProjection, p1);
    // calculate the distance between the points
    return esri.geometry.getLength(
      new esri.geometry.Point(p0.x, p0.y, this.targetSRS),
      new esri.geometry.Point(p1.x, p1.y, this.targetSRS)
      );
  },

  clearMeasurement: function() {
    this.cachedMeasurements = [0];
  },

  updateMeasurement: function() {
    var length = this.calculateMeasurementLength();
    if(length !== -1) { // -1 is an error
      var humanLength = parseFloat(length.toPrecision(7)).formatHuman();
      this.measurementInfo.update('Measurement: ' + humanLength + ' m');
    }
  },

  enableMeasurement: function() {
    this.draw.activate(esri.toolbars.Draw.POLYLINE);
    this.measurementInfo.show();
    this.measurementInfo.update('Click on the map to begin measuring from that point');
    //console.log('connecting drawing start handler');
    var drawStartHandler = dojo.connect(this.map, "onClick", this, function() {
      //console.log('removing drawing start handler');
      dojo.disconnect(drawStartHandler);
      this.clearMeasurement();
      this.updateMeasurement();
      //console.log('connecting drawing movement listener');
      this.draw.movementListener = dojo.connect(this.map, "onMouseMove", this, function() {
        this.updateMeasurement();
      });
    });
  },

  disableMeasurement: function() {
    if(this.draw.movementListener) {
      //console.log('removing drawing movement handler');
      dojo.disconnect(this.draw.movementListener);
    }
    this.draw.deactivate();
    this.map.graphics.clear();
    this.measurementInfo.hide();
  },

  handleDraw: function(geometry) {
    if(this.zoomIn.pressed) {
      this.map.setExtent(geometry, true);
    }

    if(this.measure.pressed) {
      var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255,0,0]), 1);
      var graphic = new esri.Graphic(geometry, symbol);
      this.map.graphics.add(graphic);

      if(this.draw.movementListener) {
        //console.log('removing drawing movement handler');
        dojo.disconnect(this.draw.movementListener);
      }
      //console.log('starting drawing clear handler');
      var clearListener = dojo.connect(this.map, 'onClick', this, function() {
        //console.log('removing drawing clear handler');
        dojo.disconnect(clearListener);
        this.disableMeasurement();
        if(this.measure.pressed) {
          this.enableMeasurement();
        } 
      });
    }
  },

  zoomToFullExtent: function() {
    var extent = Application.fullExtent;
    if(!extent) {
      this.navigation.zoomToFullExtent();
    } else {
      this.map.setExtent(extent);
    }
  },

  handleExtentHistoryChange: function() {
  // not yet implemented
  },

  enableIdentifyTool: function() {
    var map = this.map.proxyOwner;
    map.on('click', this.doIdentify, this, {
      single: true
    });
  },

  disableIdentifyTool: function() {
    if(this.identifyWindow) {
      this.identifyWindow.close();
    }
    this.map.graphics.clear();
  },

  doIdentify: function(evt) {
    var identifyPanel = new Atlas.IdentifyPanel();

    this.identifyWindow = new Ext.Window({
      layout: 'fit',
      title: 'Identify',
      border: false,
      bodyStyle: 'padding: 0',
      width: 500,
      height: 300,
      plain: true,
      items: [identifyPanel],
      buttons: [{
        text: 'Close',
        handler: function() {
          this.identifyWindow.close();
        },
        scope: this
      }]
    });

    var map = this.map;
    this.identifyWindow.on('show', function() {
      identifyPanel.doIdentify(map, evt.mapPoint);
    });
    this.identifyWindow.on('close', function() {
      this.identifyWindow.destroy();
      this.identifyWindow = null;
    }, this);
    this.map.proxyOwner.on('click', this.refreshIdentifyWindow, this, {
      single: true
    });

    this.identifyWindow.show();
  },

  refreshIdentifyWindow: function(evt) {
    // refresh sometimes fires when it should be disabled and even when the listener has been removed
    // so check to see if identify is enabled before proceeding with logic
    if(Ext.getCmp('identify').pressed) {
      if(this.identifyWindow) {
        this.identifyWindow.close();
      }
      this.doIdentify(evt);
    }
  },

  showExportPdfWindow: function() {
    if(!this.exportPdfWindow) {
      this.exportPdfWindow = this.createExportPdfWindow();
    }
    this.exportPdfWindow.show(this);
  },

  hideExportPdfWindow: function() {
    this.exportPdfWindow.hide(this);
  },

  createExportPdfWindow: function() {
    var map = this.map.proxyOwner;
    var services = [];
    Ext.each(map.layers, function(layer) {
      if(layer.visible) {
        services.push(layer.url);
      }
    });

    return new Ext.Window({
      layout: 'fit',
      width: 350,
      closeAction: 'hide',
      autoScroll: true,
      title: 'Export as PDF Settings',
      modal: true,
      items: new Ext.FormPanel({
        id: 'export-pdf-settings',
        border: false,
        height: 100,
        standardSubmit: true,
        items: [{
          xtype: 'textfield',
          emptyText: 'Add a title...',
          fieldLabel: 'Title',
          name: 'title'
        }, {
          xtype: 'radiogroup',
          fieldLabel: 'Page Orientation',
          columns: 1,
          items: [{
            boxLabel: 'Portrait',
            checked: true,
            name: 'page_layout',
            inputValue: 'portrait'
          }, {
            boxLabel: 'Landscape',
            name: 'page_layout',
            inputValue: 'landscape'
          }]
        }, {
          xtype: 'hidden',
          name: 'services',
          value: services.join(',')
        }]
      }),
      buttons: [{
        text: 'Export PDF',
        handler: function() {
          var exportSettings = Ext.getCmp('export-pdf-settings');
          var extent = map.proxy.extent;
          var bbox = [extent.xmin, extent.ymin, extent.xmax, extent.ymax].join(',');

          var downloadForm = '<form id="dl" action="/export" method="POST">';
          Ext.iterate(exportSettings.getForm().getValues(), function(field, value) {
            if(field === 'title' && value === 'Add a title...') {
              return;
            }
            downloadForm += '<input type="hidden" name="' + field + '" value="' + value + '" />';
          });
          downloadForm += '<input type="hidden" name="bbox" value="' + bbox + '" />';
          downloadForm += '</form>';

          var doc = Ext.getDom('downloads').contentDocument;
          doc.open();
          doc.write(downloadForm);
          doc.close();

          var form = Ext.getDom('downloads').contentDocument.getElementById('dl');
          form.submit();
        }
      }, {
        text: 'Close',
        handler: function() {
          this.exportPdfWindow.hide();
        },
        scope: this
      }]
    });
  }
});