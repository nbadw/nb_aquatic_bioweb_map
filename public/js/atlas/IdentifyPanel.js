Ext.ns('Atlas');

Atlas.IdentifyPanel = Ext.extend(Ext.TabPanel, {
  cls: 'x-identifypanel',
  tabPosition: 'left',
  alternateColor: false,
  alternateCls: 'x-identify-panel-alt',
  deferredRender: false,

  initComponent: function(){
    Atlas.IdentifyPanel.superclass.initComponent.call(this);

    this.addEvents(
      'featureselected'
      //'beforegroupchange',
      //'groupchange'
      );
    this.elements = 'body,header';
    this.stripTarget = 'header';

    this.tabPosition = this.tabPosition == 'right' ? 'right' : 'left';

    if (this.tabStyle && this.tabStyle != '') {
      this.addClass(this.cls + '-' + this.tabStyle);
    }

    if (this.alternateColor) {
      this.addClass(this.alternateCls);
    }
  },

  onRender: function(ct, position){
    Ext.TabPanel.superclass.onRender.call(this, ct, position);

    if(this.plain){
      var pos = this.tabPosition == 'top' ? 'header' : 'footer';
      this[pos].addClass('x-tab-panel-'+pos+'-plain');
    }

    var st = this[this.stripTarget];

    this.stripWrap = st.createChild({
      cls:'x-tab-strip-wrap',
      cn:{
        tag:'ul',
        cls:'x-tab-strip x-tab-strip-'+this.tabPosition
      }
    });

    var beforeEl = (this.tabPosition=='bottom' ? this.stripWrap : null);
    this.strip = new Ext.Element(this.stripWrap.dom.firstChild);

    this.body.addClass('x-tab-panel-body-'+this.tabPosition);

    if (!this.itemTpl) {
      var tt = new Ext.Template(
        '<li class="{cls}" id="{id}">',
        '<a class="x-identifypanel-expand" onclick="return false;"></a>',
        '<a class="x-identifypanel-text {iconCls}" href="#" onclick="return false;">',
        '<span class="x-tab-strip-text x-identifypanel-tab-strip-text">{text}</span></a>',
        '</li>'
        );
      tt.disableFormats = true;
      tt.compile();
      Atlas.IdentifyPanel.prototype.itemTpl = tt;
    }
  },

  afterRender: function(){
    Atlas.IdentifyPanel.superclass.afterRender.call(this);

    this.tabJoint = Ext.fly(this.body.dom.parentNode).createChild({
      cls: 'x-tab-joint'
    });

    this.addClass('x-tab-panel-' + this.tabPosition);
    this.header.setWidth(this.tabWidth);
  },

  getFrameHeight: function(){
    var h = this.el.getFrameWidth('tb');
    h += (this.tbar ? this.tbar.getHeight() : 0) +
    (this.bbar ? this.bbar.getHeight() : 0);

    return h;
  },
    
  adjustBodyWidth: function(w){
    return w - this.tabWidth;
  },

  doIdentify: function(map, geometry) {
    // show loading mask
    var loadingMask = new Ext.LoadMask(this.getEl().dom, { 
      msg: 'Starting Identify Task...'
    });
    loadingMask.show();

    Ext.each(map.__proxyOwner__.layers, function(layer) {
      if(layer.canIdentify()) { 
        console.log('identify on ' + layer.title);

        var task     = new esri.tasks.IdentifyTask(layer.url);
        var params   = new esri.tasks.IdentifyParameters();
        var layerInfos = layer.__proxy__.layerInfos;

        params.geometry = geometry;
        params.mapExtent = map.extent;
        params.tolerance = 3;
        params.returnGeometry = true;
        params.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
        params.layerIds = [];
        Ext.each(layerInfos, function(layerInfo) {
          params.layerIds.push(layerInfo.id);
        });

        this.createIdentifyResultsTab(layer, task, params);
      }
    }, this);

    this.setActiveTab(this.getComponent(0));

    // hide loading mask
    loadingMask.hide();
  },

  cancelAllIdentifyTasks: function() {

  },

  clearIdentifyTasks: function() {

  },

  createIdentifyResultsTab: function(layer, task, params) {
    var resultsPanel = new Atlas.IdentifyResultsPanel(layer, task, params);
    resultsPanel.on('featureselected', function(feature, identifyTaskResult) {
      this.fireEvent('featureselected', feature, identifyTaskResult);
    }, this);
    this.add(resultsPanel);
  }
});

Atlas.IdentifyResultsPanel = function(layer, task, params) {
  var attrs = {
    layer: layer,
    task: task,
    params: params
  };
  Atlas.IdentifyResultsPanel.superclass.constructor.call(this, attrs);
  this.addEvents('taskstatuschange');
};

Ext.extend(Atlas.IdentifyResultsPanel, Ext.Panel, {
  cls: 'x-identify-results-panel',
  layout: 'card',
  activeItem: 0,
  bodyStyle: 'padding: 10px',
  defaults: { border:false },
  request: null, // the running xhr request

  initComponent: function() {
    this.title = this.layer.name();
    this.runningPanel = this.createRunningPanel();
    this.resultsPanel = this.createResultsPanel();
    this.errorPanel   = this.createErrorPanel();
    this.items = [this.runningPanel, this.resultsPanel, this.errorPanel];
    Atlas.IdentifyResultsPanel.superclass.initComponent.call(this);
    this.addEvents('featureselected');
    this.startTask();
  },

  createRunningPanel: function() {
    return new Ext.Panel({
      html: '<p>Loading...</p><p><a href="#">Cancel</a></p>'
    });
  },

  createErrorPanel: function() {
    return new Ext.Panel({
      html: '<p>An Error Occured!</p><p class="more-details"><a href="#">Details...</a></p><p><a href="#">Retry</a></p>'
    });
  },

  createResultsPanel: function() {
    return new Ext.TabPanel({
      activeTab: 0,
      plain:true,
      enableTabScroll:true,
      defaults: { 
        autoScroll: true
      }
    });
  },

  startTask: function() {
    this.fireEvent('taskstatuschange');
    var scope = this;
    var callback = function(results) { 
      scope.taskComplete(results);
    }
    var errback  = function() { 
      scope.taskFailed();
    }
    this.request = this.task.execute(this.params, callback, errback);
  },

  taskComplete: function(results) {
    var resultGroups = this.groupResultsByLayer(results);
    for(var groupId in resultGroups) {
      var group = resultGroups[groupId];
      this.addResultGroupTab(groupId, group)
    };
    this.resultsPanel.setActiveTab(this.resultsPanel.getComponent(0));

    this.layout.setActiveItem(1);
    this.fireEvent('taskstatuschange');
  },

  taskFailed: function(error) {
    this.layout.setActiveItem(2);
    // dojoType    timeout
    // filename    http://localhost:4000/js/esri/arcgis-debug.js
    // lineNumber  4360
    // messsage    timeout exceeded
    // name        error
    // stack       Error("timeout exceeded")@:0\n()@http://localhost:4000/js/esri/arcgis-debug.js:4360\n(0)@http://localhost:4000/js/esri/arcgis-debug.js:4370\n
    this.fireEvent('taskstatuschange');
  },

  groupResultsByLayer: function(results) {
    var grouping = {};
    Ext.each(results, function(result) {
      var group = grouping[result.layerId] || [];
      group.push(result);
      grouping[result.layerId] = group;
    });
    return grouping;
  },

  addResultGroupTab: function(id, results) {
    // configure the store for identify task results
    var store = new Ext.data.JsonStore({
      autoDestroy: true,
      root: 'results',
      totalProperty: 'total',
      fields: ['declaredClass', 'displayFieldName', 'feature', 'geometryType', 'layerId', 'layerName', 'preamble', 'value'],
      data: {
        'results': results,
        'total': results.length
      }
    });

    // get a list of the column names
    var columnNames = [];
    Ext.each(results, function(result) {
      columnNames.push(result.displayFieldName);
    });
    // create the unique column configurations
    var columns = [];
    Ext.each(Ext.unique(columnNames), function(colName) {
      columns.push({
        header: colName,
        dataIndex: 'value'
      });
    });

    // add the feature class column with a custom renderer
    var featureRenderer = function(val) {
      if(val) {
        return '<a class="highlight-feature" href="#">Highlight this on map</a>';
      } else {
        return '-';
      }
    }
    columns.push({
      header: 'Feature',
      dataIndex: 'feature',
      renderer: featureRenderer
    });

    // create the results grid
    var resultsGrid = new Ext.grid.GridPanel({
      id: id,
      title: results[0].layerName + ' (' + results.length + ')',
      store: store,
      columns: columns,
      stripeRows: true,
      viewConfig: { forceFit: true },
      autoScroll: true,
      listeners: {
        'cellclick': function(grid, rowIndex, columnIndex, e) {
          var fieldName = grid.getColumnModel().getDataIndex(columnIndex);
          if (fieldName != 'feature') {
            return;
          }
          var record  = grid.getStore().getAt(rowIndex);
          var feature = record.get(fieldName);
          this.fireEvent('featureselected', feature, record.data);
        },
        scope: this
      }
    });
    this.resultsPanel.add(resultsGrid);
  }
});