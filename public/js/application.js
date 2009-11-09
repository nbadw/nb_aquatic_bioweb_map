/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Context */

/**
 * @depends ./atlas/Core.js
 * @depends ./atlas/esri/Map.js
 * @depends ./atlas/esri/Layer.js
 * @depends ./atlas/IdentifyPanel.js
 * @depends ./atlas/MapContents.js
 * @depends ./atlas/FindPanel.js
 * @depends ./atlas/MapPanel.js
 */

var Application = {
  init: function() {
    console.log('initializing map application ui');
    this.fullExtent = new esri.geometry.Extent({
      xmin: -71.6823103005143,
      ymin: 42.6758057421875,
      xmax: -59.9489118630143,
      ymax: 50.2234131640625,
      spatialReference: { wkid: 4326 }
    });

    this.map = new Atlas.esri.Map('map', {
      layers: [{
          title: 'ESRI World Imagery',
          cached: true,
          url: 'http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer',
          visible: true,
          identifiable: false
        }, {
          title: 'Provinces &amp; States',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/provinces_and_states/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Level 1 Watersheds',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/watersheds_level_01/MapServer',
          visible: true,
          identifiable: true
        }, {
          title: 'Level 2 Watersheds',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/watersheds_level_02/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Level 6 Watersheds',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/watersheds_level_06/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Major Landowner',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/major_landowners/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Crown Land',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/crown_land/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Protected Areas',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/protected_areas/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Administrative Areas',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/administrative_areas/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Lakes &amp; Streams',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/lakes_and_streams/MapServer',
          visible: true,
          identifiable: true
        }, {
          title: 'Roads',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/nb_roads/MapServer',
          visible: true,
          identifiable: false
        }, {
          title: 'Watershed Boundary Lines',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/watersheds_level_01_boundary_lines/MapServer',
          visible: true,
          identifiable: false
//        }, {
//          title: 'Place Names',
//          cached: true,
//          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/place_names/MapServer',
//          visible: true,
//          identifiable: false
        }, {
          title: 'Regulated Waters',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/regulated_waters/MapServer',
          visible: false,
          identifiable: false
        },{
          title: 'Surveyed Lakes',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/surveyed_lakes/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Lake Depths',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/lake_depths/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Stream Types',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/stream_types/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Brook Trout Habitat',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/brook_trout_habitat/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Atlantic Salmon Juvenile Habitat',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/atlantic_salmon_juvenile_habitat/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Atlantic Salmon Adult Habitat',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/atlantic_salmon_adult_habitat/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Environmental Stream Survey',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/environmental_stream_survey/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'Stocked Waters',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/stocked_waters/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Hydrometric Stations',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/hydrometric_stations/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Groundwater Monitoring Sites',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/groundwater_monitoring_stations/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Water Chemistry Sites',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/water_chemistry_sites/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Fish Counting Facilities',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/fish_counting_facilities/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Electrofishing Sites',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/electrofishing_sites/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Temperature Logger Sites',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/temperature_logger_sites/MapServer',
          visible: false,
          identifiable: true
        }, {
          title: 'All Monitoring Sites',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/all_monitoring_sites/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Stream Order',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/stream_order/MapServer',
          visible: false,
          identifiable: false
        }, {
          title: 'Waterbody IDs',
          cached: true,
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/water_body_ids/MapServer',
          visible: false,
          identifiable: false
        }
      ],
      extent: this.fullExtent
    });

    Ext.get('disclaimer-btn').on('click', this.showDisclaimerWindow, this);
    Ext.get('help-btn').on('click', this.showHelpWindow, this);

    this.header = this.createHeader();
    this.mapContents = this.createMapContents();
    this.mapPanel = this.createMapPanel();
    this.footer = this.createFooter();

    var viewport = new Ext.Viewport({
      layout: 'border',
      items: [this.header, this.mapContents, this.mapPanel, this.footer],
      listeners: {
        'afterlayout': function() {
          this.contentsLoadingMask = new Ext.LoadMask(this.mapContents.body);
          this.contentsLoadingMask.show();
        },
        single: true,
        scope: this
      }
    });

    this.map.on('load', this.mapPanel.initMapFunctionality, this.mapPanel);
    this.mapContents.on('ready', function() {
      this.contentsLoadingMask.hide();
    }, this);
  },

  showDisclaimerWindow: function() {
    if(!this.disclaimerWindow) {
      this.disclaimerWindow = this.createDisclaimerWindow();
    }
    this.disclaimerWindow.show(this);
  },

  hideDisclaimerWindow: function() {
    this.disclaimerWindow.hide();
  },

  createDisclaimerWindow: function() {
    return new Ext.Window({
      el: 'disclaimer-win',
      layout: 'fit',
      width: 500,
      height: 300,
      closeAction: 'hide',
      autoScroll: true,
      modal: true,
      buttons: [{
        text: 'OK',
        handler: this.hideDisclaimerWindow,
        scope: this
      }]
    });
  },

  showHelpWindow: function() {
    if(!this.helpWindow) {
      this.helpWindow = this.createHelpWindow();
    }
    this.helpWindow.show(this);
  },

  hideHelpWindow: function() {
    this.helpWindow.hide();
  },

  createHelpWindow: function() {
    return new Ext.Window({
      el: 'help-win',
      layout: 'fit',
      width: 500,
      height: 300,
      autoScroll: true,
      closeAction: 'hide',
      buttons: [{
        text: 'Close',
        handler: this.hideHelpWindow,
        scope: this
      }]
    });
  },

  createHeader: function() {
    return new Ext.Panel({
      region: 'north',
      contentEl: 'header',
      baseCls: 'x-plain',
      margins: '0 0 5 0',
      autoHeight: true
    });
  },

  createFooter: function() {
    return new Ext.Panel({
      region: 'south',
      contentEl: 'footer',
      baseCls: 'x-plain',
      autoHeight: true
    });
  },

  createMapContents: function() {
    return new Atlas.MapContents({
      region: 'west',
      collapsible: true,
      split: true,
      width: 200,
      margins: '0 0 5 5',
      map: this.map
    });
  },

  createMapPanel: function() {
    return new Atlas.MapPanel({
      region: 'center',
      margins: '0 5 5 0',
      contentEl: this.map.container
    });
  }
};

Ext.onReady(function() {
  // init the tooltip singleton.  any tag-based quick tips will start working.
  Ext.QuickTips.init();
  // apply config properties to the tooltip singleton
  Ext.apply(Ext.QuickTips.getQuickTip(), {
    trackMouse: true
  });
  // require esri libraries
  dojo.require("esri.map");
  dojo.require("esri.tasks.identify");
  dojo.require("esri.toolbars.draw");
  dojo.require("esri.toolbars.navigation");
  // set esri configuration
  esriConfig.defaults.io.proxyUrl = "/arcgisserver/apis/javascript/proxy/proxy.ashx";
  esriConfig.defaults.io.alwaysUseProxy = false;
  esriConfig.defaults.map.zoomDuration = 100;
  esriConfig.defaults.map.zoomRate = 100;
  // define non-standard projections for use in Proj4js
  Proj4js.defs["EPSG:2953"] = "+proj=sterea +lat_0=46.5 +lon_0=-66.5 +k=0.999912 +x_0=2500000 +y_0=7500000 +ellps=GRS80 +units=m +no_defs";
  // start the application
  Application.init();
});
