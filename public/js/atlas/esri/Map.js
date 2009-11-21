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
    'layersloaded',
    'beforeupdate',
    'update',
    'click',
    'extentchange',
    'progressupdate'
    );
  this.registerProxyEvents();

  this.totalLayers = config.layers.length;
  Ext.each(config.layers, function(layer) {
    this.addLayer(layer);
  }, this);
};

Ext.extend(Atlas.esri.Map, Ext.util.Observable, {
  layers: [],
  updating: false,
  // bookkeeping variables
  totalLayers: 0,
  layersLoaded: 0,
  updateCount: 0,
  totalTileCount: 0,
  visibleCount: 0,
  working: false,

  addLayer: function(layer, index) {
    layer = new Atlas.esri.Layer(layer);
    
    layer.on('load', function(layer) {
      this.layers.push(layer);
      this.proxy.addLayer(layer.proxy);
      if(layer.proxy.visible) {
        this.visibleCount++;
      }
      this.registerLayerListeners(layer);
      this.onLayerLoaded();
    }, this);

    layer.on('error', function(layer) {
      this.onLayerLoaded();
    }, this);

    this.on('layersloaded', function() {
      Ext.each(this.layers, function(layer) {
        this.registerLayerListeners(layer);
      }, this);
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

  registerLayerListeners: function(layer) {
    layer.on('update', this.onLayerUpdated, this);

    layer.on('visibilitychange', function(visibility) {
      if(visibility) {
        this.visibleCount++;
      } else {
        this.visibleCount--;
      }
    }, this);

    Ext.each(['tileload', 'tileerror'], function(event) {
      layer.on(event, function(layer, img) {
        if(!this.working) {
          this.totalTileCount = this.countTilesToLoad();
          if(this.totalTileCount === 0) {
            return;
          }
          this.working = true;
          this.fireEvent('beforeupdate', this);
        }
        var remainingTiles = this.countTilesToLoad();
        if(remainingTiles < 1) {
          this.working = false;
          this.fireUpdate();
        }
        this.fireProgressUpdate(remainingTiles);
      }, this);
    }, this);
  },

  onLayerLoaded: function() {
    this.layersLoaded++;
    if(this.totalLayers === this.layersLoaded) {
      this.fireEvent('layersloaded');
    }
  },

  fireProgressUpdate: function(remainingTiles) {
    var loaded  = this.totalTileCount - remainingTiles;
    this.fireEvent('progressupdate', this, loaded, this.totalTileCount);
  },

  countTilesToLoad: function() {
    var count = 0;
    Ext.each(this.layers, function(layer) {
      count += (layer.tileCount || 0);
    });
    return count;
  },

  onLayerUpdated: function() {
    this.updateCount++;
    if(this.updateCount === this.visibleCount) {
      this.fireUpdate();
    }
  },

  fireUpdate: function() {
    this.updateCount = 0;
    this.updating = false;
    this.fireEvent('update', this);
  }
});
