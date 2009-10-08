Ext.ns('Atlas.esri');

Atlas.esri.Map = function(mapEl, config) {
  config = config || {};
 
  this.__proxy__ = new esri.Map(mapEl, config);
  this.__proxy__.__proxyOwner__ = this;
  Ext.applyIf(this, this.__proxy__);

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
    this.__proxy__.addLayer(layer.__proxy__, index);
  },

  registerProxyEvents: function() {
    dojo.connect(this.__proxy__, 'onLoad', this, function(map) {
      this.fireEvent('load', map);
    });
    dojo.connect(this.__proxy__, 'onLayerAdd', this, function(layer) {
      this.fireEvent('layeradd', layer);
    });
    dojo.connect(this.__proxy__, 'onClick', this, function(evt) {
      this.fireEvent('click', evt);
    });
  },

  registerLayerUpdateTriggers: function() {
    Ext.each(['onZoomStart', 'onPanStart'], function(triggerEvent) {
      dojo.connect(this.__proxy__, triggerEvent, this, function() {
        this.loadCount = 0;
        this.updating = true;
        this.fireEvent('beforeupdate');
      });
    }, this);
  },

  onLayerUpdated: function() {
    this.loadCount++;
    if(this.loadCount == this.layers.length) {
      this.updating = false;
      this.fireEvent('update');
    }
  }

});

/*
Map Events:
  onClick(event) 	Fires when a user single clicks on the map using the mouse and the mouse pointer is within the map region of the HTML page.
  onDblClick(event) 	Fires when a user double clicks on the map using the mouse and the mouse pointer is within the map region of the HTML page.
  onExtentChange(extent, delta, levelChange, lod) 	Fires when the extent of the map has changed.
  onKeyDown(keyEvent) 	Fires when a keyboard key is pressed.
  onKeyUp(keyEvent) 	Fires when a keyboard key is released.
  - onLayerAdd(layer) 	Fires any time a layer is added to the map.
  onLayerRemove(layer) 	Fires after the layer has been removed.
  onLayerReorder(layer, index) 	Fires when the map layer order has been changed.
  onLayersRemoved() 	Fires after all the layers have been removed.
  onLayersReordered(layerIds) 	Fires when all the layers have been reordered.
  - onLoad(map) 	Fires when the first or base layer has been successfully added to the map.
  onMouseDown(event) 	Fires when a mouse button is pressed down and the mouse cursor is in the map region of the HTML page.
  onMouseDrag(event) 	Fires while the mouse is being dragged until the mouse button is released.
  onMouseDragEnd(event) 	Fires when a mouse button is released and the user stops dragging the mouse.
  onMouseDragStart(event) 	Fires when a mouse button is pressed down and the user starts to drag the mouse.
  onMouseMove(event) 	Fires any time the mouse pointer moves over the map region. A common use for this event is to show the current x,y coordinate of the map as the user moves the mouse pointer.
  onMouseOut(event) 	Fires when the mouse moves out of the map region of the HTML page.
  onMouseOver(event) 	Fires when the mouse moves into the map region of the HTML page.
  onMouseUp(event) 	Fires when the mouse button is released and the mouse pointer is within the map region of the HTML page.
  onMouseWheel(event) 	Fires when the mouse wheel is scrolled.
  onPan(extent, delta) 	Fires during the pan process.
  onPanEnd(extent, endPoint) 	Fires when the pan is complete.
  onPanStart(extent, startPoint) 	Fires when a user commences panning.
  onReposition(x, y) 	Fires when the map DIV is repositioned.
  onResize(extent, height, width) 	Fires when the Div containing the map has been resized.
  onUnload(map) 	Fires when the page is refreshed.
  onZoom(extent, zoomFactor, anchor) 	Fires during the zoom process.
  onZoomEnd(extent, zoomFactor, anchor, level) 	Fires when the zoom is complete.
  onZoomStart(extent, zoomFactor, anchor, level) 	Fires when a user commences zooming.
 */