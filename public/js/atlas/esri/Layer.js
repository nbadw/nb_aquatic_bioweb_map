/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false, nomen: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Services */

Ext.ns('Atlas.esri');

Atlas.esri.Layer = function(config) {
  this.proxy = this.createLayer(config);
  this.proxy.proxyOwner = this;
  Ext.applyIf(this, this.proxy);

  this.title = config.title; // allows overriding layer title
  if(config.identifiable) {
    this.identifiable = config.identifiable;
  }

  this.addEvents(
    'error',
    'load',
    'opacitychange',
    'beforeupdate',
    'update',
    'visibilitychange',
    'legend',
    'tileload',
    'tileerror'
  );

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
  // unsupported method to fire updates on tile loading status
  if(config.cached) {
    this.updateImagesWithoutNotify = this.proxy._updateImages;
    this.proxy._updateImages = this.updateImagesWithNotify;
    dojo.connect(this.proxy, "_tileLoadHandler", this, function(evt) {
      var img = evt.currentTarget;
      var layer = this;
      layer.tileCount--;
      this.fireEvent('tileload', this, img);
    });
    dojo.connect(this.proxy, "_tileErrorHandler", this, function(evt) {
      var img = evt.currentTarget;
      var layer = this;
      layer.tileCount--;
      this.fireEvent('tileerror', this, img);
    });
  }

  this.on('error', function(error) {
    var msg = "error while loading " + this.url + "\n";
    msg += "  code - " + error.code + "\n";
    msg += "  details - " + error.message;
    Ext.each(error.details, function(detail) {
      msg += "\n  " + detail;
    });
    console.log(msg);
  }, this);
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
      url: Services.path + '/legends',
      params: {
        url: this.url,
        image_return_url: (Ext.isIE && !Ext.isIE8)
      },
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
  },

  // * not to be used by dynamic services
  updateImagesWithNotify: function(rect) {
    var atlasLayer = this.proxyOwner;
    atlasLayer.updateImagesWithoutNotify.call(this, rect);
    if(!this._patchIE) {
      atlasLayer.tileCount = this._loadingList.count;
    } else {
      atlasLayer.tileCount = 0; // IE6 can't be notified about tiles
    }
    atlasLayer.fireEvent('beforeupdate', atlasLayer);
  }
});
