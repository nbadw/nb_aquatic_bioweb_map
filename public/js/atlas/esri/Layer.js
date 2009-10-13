Ext.ns('Atlas.esri');

Atlas.esri.Layer = function(config) {
  this.__proxy__ = this.createLayer(config);
  this.__proxy__.__proxyOwner__ = this;
  Ext.applyIf(this, this.__proxy__);

  this.addEvents('update', 'legend');

  dojo.connect(this.__proxy__, 'onUpdate', this, function() {
    this.fireEvent('update');
  });  
  dojo.connect(this.__proxy__, 'onLoad', this, function(layer) {
    this.fireEvent('load', layer.__proxyOwner__);
  });
};

Ext.extend(Atlas.esri.Layer, Ext.util.Observable, {
  legendLoaded: false,

  name: function() {
    var url_parts = this.__proxy__.url.split('/');
    var text = url_parts[url_parts.length - 2].replace('_', ' ', 'g').titleize();
    return text;
  },

  createLayer: function(config) {
    if(config instanceof esri.layers.Layer) {
      return config;
    } else if(typeof config === 'string') {
      // assume it's a dynamic service if just given the url
      return new esri.layers.ArcGISDynamicMapServiceLayer(config);
    }
    else {
      if(config.cached || config.tiled) {
        return new esri.layers.ArcGISTiledMapServiceLayer(config.url);
      } else {
        return new esri.layers.ArcGISDynamicMapServiceLayer(config.url);
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