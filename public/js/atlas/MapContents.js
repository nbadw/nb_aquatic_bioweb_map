Ext.ns('Atlas');

Atlas.MapContents = Ext.extend(Ext.tree.TreePanel, {
  lines: false,
  cls: 'x-map-contents',
  title: 'Map Contents',
  rootVisible: false,
  autoScroll: true,
  minWidth: 150,
  ready: false,
  legendsLoaded: 0,
  iconCls: 'map-contents',

  initComponent: function() {
    this.root = new Ext.tree.TreeNode({
      text: 'Map Contents'
    });

    // create the initial layer list
    Ext.each(this.map.layers, function(layer) {
      this.addLayer(layer);
    }, this);

    this.addEvents('ready');
    Atlas.MapContents.superclass.initComponent.call(this);

    new Atlas.MapContentsTreeSorter(this);

    this.on('checkchange', function(node, checked) {
      this.toggleLayerVisible(node, checked);
    }, this);

    this.on('contextmenu', function(node, e) {
      var type = node.attributes.type;
      // no actions for legend class nodes
      if(type == 'LegendClassNode') {
        return;
      }
      // create the context menu if not already initialized
      if (!this.contextMenu) {
        this.contextMenu = this.createContextMenu();
      }
      // show the menu
      this.ctxNode = node;
      this.contextMenu.showAt(e.getXY());
    }, this);
  },

  addLayer: function(layer) {
    if(layer.loaded) {
      this.loadLegend(layer);
    } else {
      layer.on('load', this.loadLegend, this);
    }
  },

  loadLegend: function(layer) {
    if(layer.legendLoaded) {
      this.layerReady(layer, layer.legend);
    } else {
      layer.on('legend', this.layerReady, this);
      layer.loadLegend();
    }
  },

  layerReady: function(layer, legend) {
    this.buildLayerNodes(layer, legend);
    // check to see if everything is ready
    this.legendsLoaded++;
    if(this.legendsLoaded == this.map.layers.length) {
      this.fireEvent('ready');
    }
  },

  buildLayerNodes: function(layer, legend) {
    var esriLayer = layer.__proxy__;
    this.buildLayerNode(esriLayer);

    Ext.each(esriLayer.layerInfos, function(layerInfo) {
      this.buildLayerInfoNode(esriLayer, layerInfo);
    }, this);

    Ext.each(legend, function(legendInfo) {
      this.buildLegendInfoNode(esriLayer, legendInfo);
    }, this);
  },

  buildLayerNode: function(layer) {
    var name = layer.__proxyOwner__.name();
    this.root.appendChild(new Ext.tree.TreeNode({
      layerId: layer.id,
      text: name,
      iconCls: 'layer',
      layer: layer,
      checked: layer.visible,
      uiProvider: Atlas.LayerNodeUI,
      type: 'LayerNode'
    }));
  },

  buildLayerInfoNode: function(layer, layerInfo) {
    var parent = layerInfo.parentLayerId != -1 ?
    this.findLayerInfoNode(layer.id, layerInfo.parentLayerId) :
    this.root.findChild('layerId', layer.id);
    
    parent.appendChild(new Ext.tree.TreeNode({
      text: layerInfo.name,
      layer: layer,
      layerId: layer.id,
      layerInfo: layerInfo,
      layerInfoId: layerInfo.id,
      uiProvider: Atlas.MapContentsNodeUI,
      type: 'LayerInfoNode'
    }));
  },

  buildLegendInfoNode: function(layer, legendInfo) {
    var targetLayerInfoNode = this.findLayerInfoNode(layer.id, legendInfo['layer_id']);    
    var legendGroup = legendInfo['legend_groups'][0];

    if(legendGroup['legend_classes'].length == 1) {
      targetLayerInfoNode.attributes.symbolImage = legendGroup['legend_classes'][0]['symbol_image'];
    } else {
      Ext.each(legendGroup['legend_classes'], function(legendClass) {
        this.buildLegendClassNode(targetLayerInfoNode, legendClass);
      }, this);
    }
  },

  addLegendToLayerInfo: function(layerInfoNode, symbolImage) {
    var attrs = Ext.apply(layerInfoNode.attributes, {
      icon: symbolImage.image_url
    });
    var replacementNode = new Ext.tree.TreeNode(attrs);
    layerInfoNode.parentNode.replaceChild(replacementNode, layerInfoNode);
  },

  buildLegendClassNode: function(layerInfoNode, legendClass) {
    // XXX: workaround to catch gradient legends
    if(legendClass['label'] == null) {
      layerInfoNode.attributes.gradientLegendInfoNode = true;
    }

    layerInfoNode.appendChild(new Ext.tree.TreeNode({
      text: legendClass['label'],
      qtip: legendClass['description'],
      symbolImage: legendClass['symbol_image'],
      legendClass: legendClass,
      uiProvider: Atlas.MapContentsNodeUI,
      type: 'LegendClassNode'
    }));
  },

  findLayerInfoNode: function(layerId, layerInfoId) {
    var foundNode = null;
    var layerNode = this.root.findChild('layerId', layerId);
    if(layerNode) {
      layerNode.cascade(function(node) {
        if(node.attributes.layerInfoId === layerInfoId) {
          foundNode = node;
          return false;
        } else {
          return true;
        }
      });
    }
    return foundNode;
  },

  showContentsInfoWindow: function() {
    if(!this.contentsInfoWindow) {
      this.contentsInfoWindow = this.createContentsInfoWindow();
    }
    this.contentsInfoWindow.displayInfo(this.ctxNode);
  },

  hideContentsInfoWindow: function() {
    this.contentsInfoWindow.hide();
  },

  createContentsInfoWindow: function() {
    return new Atlas.ContentsInfoWindow({
      width: 500,
      height: 300,
      buttons: [{
        text: 'Close',
        handler: this.hideContentsInfoWindow,
        scope: this
      }]
    });
  },

  toggleLayerVisible: function(node, visible) {
    var layer = node.attributes.layer;
    if(visible) {
      layer.show();
      node.getUI().removeClass('layer-hidden');
    } else {
      layer.hide();
      node.getUI().addClass('layer-hidden');
    }
  },
  
  createContextMenu: function() {
    return new Ext.menu.Menu({
      id: 'mapContentsCtxMenu',
      items: [{
        text: 'About',
        id: 'btn-information',
        icon: './images/information.png',
        tooltip: 'Click for information on the selected layer',
        handler: this.showContentsInfoWindow,
        scope: this
      }]
    });
  }

});

Atlas.LayerNodeUI = Ext.extend(Ext.tree.TreeNodeUI, {
  // private
  onDblClick : function(e) {
    e.preventDefault();
    if(this.disabled){
      return;
    }
    if(!this.animating && this.node.isExpandable()){
      this.node.toggle();
    }
    this.fireEvent("dblclick", this.node, e);
  }
});

Atlas.MapContentsNodeUI = Ext.extend(Ext.tree.TreeNodeUI, {
  focus: Ext.emptyFn, // prevent odd scrolling behavior

  renderElements : function(node, attrs, targetNode, bulkRender) {
    if(node.childNodes.length > 0) {
      attrs.iconCls = 'legend-group';
    }
    // do the actual rendering
    Atlas.MapContentsNodeUI.superclass.renderElements.apply(this, arguments);
    if(node.parentNode && node.parentNode.attributes.gradientLegendInfoNode) {
      node.getUI().addClass('gradient-legend-node');
    }
    // set and resize the custom icon if necessary
    if(attrs.symbolImage) {
      var symbol = attrs.symbolImage;
      var iconEl = Ext.fly(this.getIconEl());

      var w = 16; var h = 16; // or resize width if necessary
      if(symbol['image_height'] != symbol['image_width']) {
        w = (symbol['image_width'] * h) / symbol['image_height'];
      }

      iconEl.applyStyles({
        backgroundImage: 'none',
        height: h + 'px',
        width:  w + 'px'
      });
      iconEl.dom.src = attrs.symbolImage['image_url'];
    }
  }
});

Atlas.MapContentsTreeSorter = Ext.extend(Ext.tree.TreeSorter, {
  customSortFn: function(n1, n2) {
    // folders are listed first
    if(n1.childNodes.length > 0 || n2.childNodes.length > 0) {
      if(n1.childNodes.length > 0 && n2.childNodes.length > 0) {
        return (n1.text.toUpperCase() > n2.text.toUpperCase() ? 1 : -1);
      } else {
        // this ensures that folders are listed first
        return (n1.childNodes.length > 0 ? -1 : 1);
      } 
    } else {
      return (n1.text.toUpperCase() > n2.text.toUpperCase() ? 1 : -1);
    }
  },

  doSort: function(node) {
    // only sort if node doesn't have gradient legends!
    if(!node.attributes.gradientLegendInfoNode) {
      node.sort(this.customSortFn);
    }
  }
});