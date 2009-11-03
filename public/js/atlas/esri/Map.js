/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Context */

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
    'click'
    );
  
  this.registerProxyEvents();
  this.registerLayerUpdateTriggers();

  Ext.each(config.layers, function(layer) {
    this.addLayer(layer);
  }, this);
};

Ext.extend(Atlas.esri.Map, Ext.util.Observable, {
  layers: [],
  loadCount: 0,
  updating: false,

  addLayer: function(layer, index) {
    layer = new Atlas.esri.Layer(layer);
    layer.on('update', this.onLayerUpdated, this);
    this.layers.push(layer);
    this.proxy.addLayer(layer.proxy, index);
  },

  registerProxyEvents: function() {
    dojo.connect(this.proxy, 'onLoad', this, function(map) {
      this.fireEvent('load', map);
    });
    dojo.connect(this.proxy, 'onLayerAdd', this, function(layer) {
      this.fireEvent('layeradd', layer);
    });
    dojo.connect(this.proxy, 'onClick', this, function(evt) {
      this.fireEvent('click', evt);
    });
  },

  registerLayerUpdateTriggers: function() {
    Ext.each(['onZoomStart', 'onPanStart'], function(triggerEvent) {
      dojo.connect(this.proxy, triggerEvent, this, function() {
        this.loadCount = 0;
        this.updating = true;
        this.fireEvent('beforeupdate');
      });
    }, this);
  },

  onLayerUpdated: function() {
    this.loadCount++;
    if(this.loadCount === this.layers.length) {
      this.updating = false;
      this.fireEvent('update');
    }
  }
});
