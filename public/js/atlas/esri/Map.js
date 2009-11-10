/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Services */

Ext.ns('Atlas.esri');

Atlas.esri.Map = function(mapEl, config) {
  config = config || {};
 
  this.proxy = new esri.Map(mapEl, config);
  this.proxy.proxyOwner = this;
  Ext.applyIf(this, this.proxy);

  this.addEvents(
    'load',
    'layeradd',
    'beforeupdate',
    'update',
    'click',
    'extentchange'
  );
  
  this.registerProxyEvents();
  this.registerLayerUpdateTriggers();

  Ext.each(config.layers, function(layer) {
    this.availableLayers += 1;
    this.addLayer(layer);
  }, this);
};

Ext.extend(Atlas.esri.Map, Ext.util.Observable, {
  layers: [],
  availableLayers: 0,
  loadCount: 0,
  visibleCount: 0,
  updating: false,

  addLayer: function(layer, index) {
    layer = new Atlas.esri.Layer(layer);
    layer.on('update', this.onLayerUpdated, this);
    layer.on('load', function(layer) {
      console.log('loaded ' + layer.url);
      this.layers.push(layer);
      this.proxy.addLayer(layer.proxy);
    }, this);
    layer.on('error', function(layer) {
      this.availableLayers -= 1;
    }, this);
  },

  registerProxyEvents: function() {
    dojo.connect(this.proxy, 'onLoad', this, function(map) {
      this.fireEvent('load', map);
    });
    dojo.connect(this.proxy, 'onLayerAdd', this, function(layer) {
      this.fireEvent('layeradd', layer.proxyOwner);
    });
    dojo.connect(this.proxy, 'onClick', this, function(evt) {
      this.fireEvent('click', evt);
    });
    dojo.connect(this.proxy, 'onExtentChange', this, function(extent, delta, levelChange, lod) {
      this.fireEvent('extentchange', extent, delta, levelChange, lod);
    });
  },

  registerLayerUpdateTriggers: function() {
    Ext.each(['onZoomStart', 'onPanStart'], function(triggerEvent) {
      dojo.connect(this.proxy, triggerEvent, this, function() {
        this.loadCount = 0;
        this.visibleCount = this.countVisibleLayers();
        this.updating = true;
        this.fireEvent('beforeupdate');
      });
    }, this);
  },

  onLayerUpdated: function() {
    this.loadCount++;
    if(this.loadCount === this.visibleCount) {
      this.updating = false;
      this.fireEvent('update');
    }
  },

  countVisibleLayers: function() {
    var count = 0;
    Ext.each(this.layers, function(layer) {
      if(layer.proxy.visible) {
        count += 1;
      }
    });
    return count;
  }
});
