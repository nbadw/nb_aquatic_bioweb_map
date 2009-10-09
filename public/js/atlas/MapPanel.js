Ext.ns('Atlas');

Atlas.MapPanel = Ext.extend(Ext.Panel, {
  cls: 'x-mappanel',

  initComponent: function() {
    this.tbar = [
    {
      id: 'zoom-in',
      icon: './images/zoom-in2.png',
      tooltip: 'Zoom In (Ctrl + Click and drag mouse over map)',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      toggleHandler: function(button, pressed) {
        pressed ? this.enableDragZoom() : this.disableDragZoom();
      },
      scope: this
    },

    {
      icon: './images/full-extent2.png',
      tooltip: 'Zoom To Full Extent',
      scale: 'medium',
      handler: function() {
        this.navigation.zoomToFullExtent();
      },
      scope: this
    },

    {
      id: 'identify',
      icon: './images/query.png',
      tooltip: 'Identify',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      toggleHandler: function(button, pressed) {
        pressed ? this.enableIdentifyTool() : this.disableIdentifyTool();
      },
      scope: this
    },

    {
      icon: './images/search.png',
      tooltip: 'Find a place',
      scale: 'medium',
      handler: this.showFindWindow,
      scope: this
    },

    {
      id: 'measure',
      icon: './images/ruler.png',
      tooltip: 'Measure',
      enableToggle: true,
      scale: 'medium',
      toggleGroup: 'map-tools',
      toggleHandler: function(button, pressed) {
        pressed ? this.enableMeasurement() : this.disableMeasurement();
      },
      scope: this
    },

    {
      id: 'print-pdf',
      icon: './images/page_white_acrobat.png',
      tooltip: 'Export Map as PDF',
      scale: 'medium',
      handler: this.showExportPdfWindow,
      scope: this
    }
    ];

    this.bbar = [
    {
      id: 'mapInfo',
      icon: './images/world.png',
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
      text: 'Loading...'
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

    Ext.getDoc().on({
      keydown: function(evt) {
        // if ctrl is pressed
        if(evt.button == 16) {
          this.zoomIn.toggle(true);
        }
      },
      keyup: function(evt) {
        // if ctrl is released
        if(evt.button == 16) {
          this.zoomIn.toggle(false);
        }
      },
      scope: this
    });

    this.attachUpdateMonitor();
  },

  attachUpdateMonitor: function() {
    // for access to ext-style events, we'll need to access Atlas.esri.Map instance
    var map     = this.map.__proxyOwner__;
    var status  = this.mapStatus.getEl();
    var updater = new Ext.util.TaskRunner();
    var task    = {
      run: function() {
        var re = /\.{3}$/;
        var text = status.dom.innerHTML;
        if(re.test(text)) {
          text = text.replace(re, '');
        } else {
          text += '.';
        }
        status.update(text);
      },
      interval: 100
    };

    var showStatus = function() {
      status.show();
      updater.start(task);
    };

    var hideStatus = function() {
      status.hide();
      updater.stop(task);
    }

    map.updating ? showStatus.call() : hideStatus.call();
    map.on('beforeupdate', showStatus);
    map.on('update', hideStatus);
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
    //console.log("currently drawing: " + this.draw._tGraphic.geometry.paths[0]);
    var currentPath = this.draw._tGraphic.geometry.paths[0];
    length += this.calculateDistance(currentPath[0], currentPath[1]);
    //console.log("length = " + length);

    // get the cached measurement of each fixed line segment
    //console.log("current path:  " + this.draw._graphic.geometry.paths[0]);
    Ext.each(this.draw._graphic.geometry.paths[0] , function(point, i, points) {
      var cachedLength = this.cachedMeasurements[i];
      // not cached, then calculate and cache
      if(cachedLength == null) {
        cachedLength = this.calculateDistance(points[i-1], point);
        this.cachedMeasurements[i] = cachedLength;
      }
      //console.log('cached length #' + i + ': ' + cachedLength);
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
    if(length != -1) { // -1 is an error
      this.measurementInfo.update('Measurement: ' + length + ' m');
    }
  //length.toPrecision(7)
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

  handleExtentHistoryChange: function() {
  // not yet implemented
  },

  enableIdentifyTool: function() {
    var map = this.map.__proxyOwner__;
    map.on('click', this.doIdentify, this, { 
      single: true
    });
  },

  disableIdentifyTool: function() {
    this.identifyWindow.close();
    this.map.graphics.clear();
    this.map.__proxyOwner__.un('click', this.identifyWindowCloseHandler, this);
    if(this.identify.pressed) {
      this.enableIdentifyTool();
    }
  },

  doIdentify: function(evt) {
    var identifyPanel = new Atlas.IdentifyPanel();
    identifyPanel.on('featureselected', function(feature, identifyTaskResult) {
      this.map.graphics.clear();
      feature.setSymbol(new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 1), new dojo.Color([255,255,0,0.5])))
      this.map.graphics.add(feature);
    }, this);

    this.identifyWindow = new Ext.Window({
      layout: 'fit',
      title: 'Identify',
      bodyBorder: false,
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

    this.identifyWindow.on('close', this.disableIdentifyTool, this);

    this.identifyWindowCloseHandler = function() {
      this.identifyWindow.close();
    };
    this.map.__proxyOwner__.on('click', this.identifyWindowCloseHandler, this);

    this.identifyWindow.show();
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
    var map = this.map.__proxyOwner__;
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
        },
        //        {
        //          xtype: 'combo',
        //          forceSelection: true,
        //          fieldLabel: 'Paper Size',
        //          name: 'page_size',
        //          store: new Ext.data.ArrayStore({
        //            fields: ['size', 'dimensions'],
        //            data: [
        //              ['A4', '?'],
        //              ['Legal', '?']
        //            ]
        //          }),
        //          width: 160,
        //          displayField: 'size',
        //          typeAhead: true,
        //          mode: 'local',
        //          triggerAction: 'all',
        //          selectOnFocus:true,
        //          value: 'A4' },
        {
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
          var extent = map.__proxy__.extent;
          var bbox = [extent.xmin, extent.ymin, extent.xmax, extent.ymax].join(',');

          var downloadForm = '<form id="dl" action="/export" method="POST">';
          Ext.iterate(exportSettings.getForm().getValues(), function(field, value) {
            if(field == 'title' && value == 'Add a title...') {
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