Context = {
  path: ''
};

Application = {
  init: function() {
    console.log('initializing map application ui');
    this.fullExtent = new esri.geometry.Extent({
      xmin: -69.3504643875024,
      ymin: 42.84622,
      xmax: -63.4013632447762,
      ymax: 50.55837,
      spatialReference: { wkid: 4326 }
    });

    this.map = new Atlas.esri.Map('map', {
      layers: [{
          url: 'http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer',
          cached: true
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/provinces_and_states/MapServer',
          cached: true
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/watersheds_level_01/MapServer',
          cached: true
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/base_layers/MapServer',
          cached: true
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/place_names/MapServer',
          cached: true
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/stream_types/MapServer',
          cached: true,
          visible: false
        }, {
          url: 'http://river.nbwaters.unb.ca/ArcGIS/rest/services/bioweb/temperature_logger_sites/MapServer',
          cached: true,
          visible: false
        }
      ],
      extent: this.fullExtent
    });

    Ext.get('disclaimer-btn').on('click', this.showDisclaimerWindow, this);
    Ext.get('help-btn').on('click', this.showHelpWindow, this);

    this.header = this.createHeader();
    this.mapContents = this.createMapContents();
    this.mapPanel = this.createMapPanel();

    var viewport = new Ext.Viewport({
      layout: 'border',
      items: [this.header, this.mapContents, this.mapPanel],
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
  Ext.QuickTips.init();
  //Ext.state.Manager.setProvider(new Ext.state.SessionProvider({state: Ext.appState}));
  dojo.require("esri.map");
  dojo.require("esri.tasks.identify");
  dojo.require("esri.toolbars.draw");
  dojo.require("esri.toolbars.navigation");

  esriConfig.defaults.io.proxyUrl = "/arcgisserver/apis/javascript/proxy/proxy.ashx";
  esriConfig.defaults.io.alwaysUseProxy = false;
  esriConfig.defaults.map.zoomDuration = 100;
  esriConfig.defaults.map.zoomRate = 100;

  Proj4js.defs["EPSG:2953"] = "+proj=sterea +lat_0=46.5 +lon_0=-66.5 +k=0.999912 +x_0=2500000 +y_0=7500000 +ellps=GRS80 +units=m +no_defs";

  Application.init();
});
