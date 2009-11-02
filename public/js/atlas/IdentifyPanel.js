Ext.ns('Atlas');

Atlas.IdentifyPanel = Ext.extend(Ext.Panel, {
  initComponent: function() {
    Ext.apply(this, {
      layout:'card',
      activeItem: 2,
      flex: 1,
      border: false,
      items: [
      this.createMessagePanel('initial-identify-panel', 'TODO: initial identify message'),
      this.createMessagePanel('no-identify-results-panel', 'TODO: no results message'),
      this.createResultsPanel()
      ]
    });
    this.addEvents('geometryselected');
    Atlas.IdentifyPanel.superclass.initComponent.apply(this, arguments);
  },

  activateInitialPanel: function() {
    this.getLayout().setActiveItem(0);
  },

  activateNoResultsPanel: function() {
    this.getLayout().setActiveItem(1);
  },

  activateResultsPanel: function() {
    this.getLayout().setActiveItem(2);
  },

  createMessagePanel: function(id, msg) {
    var msgPanel = new Ext.Panel({
      bodyCssClass: id,
      layout:'vbox',
      border: false,
      layoutConfig: {
        pack: 'center',
        align: 'center'
      },
      items: {
        id: id + '-msg',
        html: msg,
        border: false
      }
    });
    return msgPanel;
  },

  createResultsPanel: function() {
    var attributesGrid = new Ext.grid.PropertyGrid({
      autoScroll: true,
      border: false,
      stripeRows: true,
      source: {},
      listeners: {
        beforeedit: function() {
          return false;
        }
      }
    });

    var attributesPanel = new Ext.Panel({
      layout:'card',
      region: 'center',
      border: false,
      activeItem: 0,
      items: [
        this.createMessagePanel('no-result-selected-panel', 'TODO: no result selected'),
        attributesGrid
      ]
    });

    this.resultsTree = new Atlas.IdentifyResultsTreePanel({
      region: 'west',
      width: 200,
      minWidth: 150,
      split: true,
      listeners: {
        click: function(node, evt) {
          var result = node.attributes.result;
          if(result) {            
            attributesGrid.setSource(result.feature.attributes);
            attributesPanel.getLayout().setActiveItem(1);
          } else {
            attributesPanel.getLayout().setActiveItem(0);
          }
          
          if(result && result.feature.geometry) {
            this.fireEvent('geometryselected', result, result.feature.geometry);
          }
        },
        scope: this
      }
    });

    var resultsPanel = new Ext.Panel({
      layout: 'border',
      items: [this.resultsTree, attributesPanel]
    });
    return resultsPanel;
  },

  doIdentify: function(map, geometry) {
    // clear the previous results
    this.resultsTree.clearResults();

    var atlasMap = map.__proxyOwner__;
    Ext.each(atlasMap.layers, function(layer) {
      if(layer.canIdentify()) {
        var task = new esri.tasks.IdentifyTask(layer.url);
        var params = new esri.tasks.IdentifyParameters();
        var layerInfos = layer.__proxy__.layerInfos;

        params.geometry = geometry;
        params.mapExtent = map.extent;
        params.tolerance = 5;
        params.returnGeometry = true;
        params.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
        params.height = map.height;
        params.width = map.width;
        params.dpi = 96;

        this.resultsTree.addIdentifyTask(layer, task, params);
      }
    }, this);
  }
});

Atlas.IdentifyResultsTreePanel = Ext.extend(Ext.tree.TreePanel, {  
  autoScroll: true,
  animate: true,
  border: false,
  rootVisible: false,
  root: { 
    text: 'Results'
  },

  clearResults: function() {
    Ext.each(this.root.childNodes, function(node) {
      this.root.removeChild(node);
    }, this);
  },

  addIdentifyTask: function(layer, task, params) {
    var node = new Atlas.IdentifyTaskNode(layer, task, params);
    this.root.appendChild(node);
  }
});

Atlas.IdentifyTaskNode = function(layer, task, params) {
  this.loaded = false;
  this.loading = false;
  this.layer = layer;
  this.task = task;
  this.params = params;
  Atlas.IdentifyTaskNode.superclass.constructor.call(this, {
    text: layer.title
  });
  this.addEvents('beforeload', 'load');
};

Ext.extend(Atlas.IdentifyTaskNode, Ext.tree.TreeNode, {
  expand: function(deep, anim, callback, scope) {
    if(this.loading) { // if an identify task is already running, waiting until it's done
      var timer;
      var f = function() {
        if(!this.loading) { // done loading
          clearInterval(timer);
          this.expand(deep, anim, callback, scope);
        }
      }.createDelegate(this);
      timer = setInterval(f, 200);
      return;
    }
    if(!this.loaded) {
      if(this.fireEvent("beforeload", this) === false) {
        return;
      }
      this.loading = true;
      this.ui.beforeLoad(this);
      this.startIdentifyTask(deep, anim, callback, scope);
      return;
    }
    Atlas.IdentifyTaskNode.superclass.expand.call(this, deep, anim, callback, scope);
  },

  isLoading: function() {
    return this.loading;
  },

  loadComplete: function(deep, anim, callback, scope) {
    this.loading = false;
    this.loaded = true;
    this.ui.afterLoad(this);
    this.fireEvent("load", this);
    this.expand(deep, anim, callback, scope);
  },

  isLoaded: function() {
    return this.loaded;
  },

  hasChildNodes: function() {
    if(!this.isLeaf() && !this.loaded) {
      return true;
    } else {
      return Atlas.IdentifyTaskNode.superclass.hasChildNodes.call(this);
    }
  },

  startIdentifyTask: function(deep, anim, callback, loadingScope) {
    var scope = this;
    var successCallback = function(results) {
      scope.identifyTaskComplete(results);
      scope.loadComplete(deep, anim, callback, loadingScope);
    }
    var errorCallback = function() {
      scope.identifyTaskFailed();
      scope.loadComplete(deep, anim, callback, loadingScope);
    }
    this.task.execute(this.params, successCallback, errorCallback);
  },

  identifyTaskFailed: function() {
  },

  identifyTaskComplete: function(results) {
    Ext.each(results, function(result) {
      this.addResult(result);
    }, this);
  },

  addResult: function(result) {
    var layerNode = this.findOrCreateLayerNode(result);
    var resultNode = new Ext.tree.TreeNode({
      text: result.value,
      result: result
    });
    layerNode.appendChild(resultNode);
  },

  findOrCreateLayerNode: function(result) {
    var layerNode = this.findChild('layerId', result.layerId);
    if(!layerNode) {
      layerNode = new Ext.tree.TreeNode({
        layerId: result.layerId,
        layerName: result.layerName,
        count: 0,
        expanded: true
      });
      this.appendChild(layerNode);
    }
    layerNode.attributes.count = layerNode.attributes.count + 1;
    layerNode.setText(layerNode.attributes.layerName + ' (' + layerNode.attributes.count + ')');
    return layerNode;
  }
});