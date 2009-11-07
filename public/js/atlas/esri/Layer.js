/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Context */

Ext.ns('Atlas.esri');

Atlas.esri.Layer = function(config) {
  this.proxy = this.createLayer(config);
  this.proxy.proxyOwner = this;
  Ext.applyIf(this, this.proxy);

  this.title = config.title; // allows overriding layer title
  if(config.identifiable) {
    this.identifiable = config.identifiable;
  }

  this.addEvents('error', 'load', 'opacitychange', 'update', 'visibilitychange', 'legend');

  dojo.connect(this.proxy, 'onError', this, function(error) {
    this.fireEvent('error', error);
  });
  dojo.connect(this.proxy, 'onLoad', this, function(layer) {
    this.fireEvent('load', layer.proxyOwner);
  });
  dojo.connect(this.proxy, 'onOpacityChange', this, function(opacity) {
    this.fireEvent('opacitychange', opacity);
  });
  dojo.connect(this.proxy, 'onUpdate', this, function() {
    this.fireEvent('update');
  });
  dojo.connect(this.proxy, 'onVisibilityChange', this, function(visibility) {
    this.fireEvent('visibilitychange', visibility);
  });
};

Ext.extend(Atlas.esri.Layer, Ext.util.Observable, {
  legendLoaded: false,
  identifiable: false,

  name: function() {
    if(!this.title) {
      var url_parts = this.proxy.url.split('/');
      var text = url_parts[url_parts.length - 2].replace('_', ' ', 'g').titleize();
      this.title = text;
    }
    return this.title;
  },

  canIdentify: function() {
    // should only identify when layer is visible
    return (this.identifiable && this.proxy.visible);
  },

  createLayer: function(config) {
    if(config instanceof esri.layers.Layer) {
      return config;
    } else if(typeof config === 'string') {
      // assume it's a dynamic service if just given the url
      return new esri.layers.ArcGISDynamicMapServiceLayer(config);
    }
    else {
      var options = { 
        visible: config.visible,
        opacity: config.opacity
      };
      if(config.cached || config.tiled) {
        return new esri.layers.ArcGISTiledMapServiceLayer(config.url, options);
      } else {
        return new esri.layers.ArcGISDynamicMapServiceLayer(config.url, options);
      }
    }
  },

  loadLegend: function() {
    this.requestLegend();
  },

  requestLegend: function() {
    Ext.Ajax.request({
      url: Context.path + '/legends',
      params: { url: this.url },
      method: 'GET',
      success: function(response, options) {
        this.legend = Ext.decode(response.responseText);
        this.legendLoaded = true;
        this.fireEvent('legend', this, this.legend);
      },
      failure: function() {
        console.log('load legend failed');
        console.log(arguments);
        this.legendLoaded = true;
        this.fireEvent('legend', this, null);
      },
      scope: this
    });
  }
});

  /*
Layer Events:
   */