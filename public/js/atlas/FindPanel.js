/*jslint white: false, onevar: false, browser: true, eqeqeq: true, bitwise: true, plusplus: false */
/*global window,Ext,esri,esriConfig,dojo,Proj4js,Atlas,Application,Services */

Ext.ns('Atlas');

Atlas.FindPanel = Ext.extend(Ext.Panel, {
  cls: 'x-find-panel',

  initComponent: function() {
    this.layout = {
      type:'vbox',
      align:'stretch',
      padding: 5
    };
    
    var placeNameStore = new Ext.data.GroupingStore({
      proxy: new Ext.data.HttpProxy({
        method: 'GET',
        url: Services.path + '/places'
      }),
      reader: new Atlas.PlaceReader(),
      autoDestroy: true,
      sortInfo: {
        field: 'geoname',
        direction: 'ASC'
      },
      groupField: 'generic_term'
    });

    var placeNameSearchField = new Atlas.PlaceNameSearchField({
      style: 'margin-bottom: 5px'
    });

    var resultsGrid = new Ext.grid.GridPanel({
      flex: 1,
      store: placeNameStore,
      columns: [
      {
        id: 'geoname',
        header: "Name",
        width: 160,
        sortable: true,
        dataIndex: 'geoname'
      },
      {
        header: "Province",
        width: 75,
        dataIndex: 'region_name'
      },
      {
        header: "Type",
        width: 75,
        dataIndex: 'generic_term'
      }
      ],
      view: new Ext.grid.GroupingView({
        forceFit: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
      }),
      stripeRows: true,
      autoExpandColumn: 'geoname',
      listeners: {
        cellclick: function(grid, row, col, e) {
          var record = grid.getStore().getAt(row);
          var x = parseFloat(record.data.londec);
          var y = parseFloat(record.data.latdec);
          this.fireEvent('placeclick', record.data, x, y);
        },
        celldblclick: function(grid, row, col, e) {
          var record = grid.getStore().getAt(row);
          var x = parseFloat(record.data.londec);
          var y = parseFloat(record.data.latdec);
          this.fireEvent('placedblclick', record.data, x, y);
        },
        scope: this
      }
    });

    /* This triggers before render to setup mouseovers tooltips on grid. */
    resultsGrid.on('render', function() {
      resultsGrid.tip = new Ext.ToolTip({
        view: resultsGrid.getView(),
        target: resultsGrid.getView().mainBody,
        delegate: '.x-grid3-row', // necessary
        trackMouse: true,
        renderTo: document.body,
        listeners: {
          beforeshow: function(tip) {
            var i       = resultsGrid.getView().findRowIndex(tip.triggerElement);
            var record  = resultsGrid.getStore().getAt(i);
            var geoname = record.get('geoname');
            tip.body.dom.innerHTML = "Click to place a marker for " + geoname + " on the map, double-click to zoom to its location";
          }
        }
      });
    });

    this.resultsPanel = new Ext.Panel({
      layout:'card',
      activeItem: 0,
      flex: 1,
      items: [
        resultsGrid,
        new Ext.Panel({
          bodyCssClass: 'no-placename-results-panel',
          layout:'vbox',
          layoutConfig: {
              pack: 'center',
              align: 'center'
          },
          items: {
            id: 'no-placename-results',
            html: 'No results found for search query.',
            border: false
          }
        })
      ]
    });

    this.items = [placeNameSearchField, this.resultsPanel];

    placeNameSearchField.on('triggered', function(text) {
      placeNameStore.load({
        params: { geoname: text }
      });
    });

    placeNameStore.on('beforeload', function(store, options) {
      if(!this.loadingMask) {
        this.loadingMask = new Ext.LoadMask(this.resultsPanel.body, { msg:"Searching..."});
      }
      this.loadingMask.show();
    }, this);

    placeNameStore.on('load', function(store, records, options) {
      this.resultsPanel.getLayout().setActiveItem(0);
      this.loadingMask.hide();      
    }, this);

    // an exception gets thrown when there are no results
    placeNameStore.on('exception', function() {
      this.resultsPanel.getLayout().setActiveItem(1);
      this.loadingMask.hide();     
    }, this);

    Atlas.FindPanel.superclass.initComponent.call(this);
  }
});

Atlas.PlaceNameSearchField = Ext.extend(Ext.form.TriggerField, {
  triggerClass: 'x-form-search-trigger',
  emptyText: 'Enter a place name...',
  allowBlank: false,
  minLength: 3,

  initComponent : function()  {
    this.addEvents('triggered');
    Atlas.PlaceNameSearchField.superclass.initComponent.call(this);
    this.on('specialkey', function(f, e) {
      if(e.getKey() === e.ENTER) {
        this.onTriggerClick();
      }
    }, this);
  },

  onTriggerClick : function() {
    if(this.validate()) {
      this.fireEvent('triggered', this.getValue());
    }
  }
});

Atlas.PlaceReader = function() {
  var meta = {
    root: 'PlaceName',
    idProperty: 'cgndb_key',
    successProperty: 'success',
    totalProperty: 'total',
    fields: [
    'generic_term',
    'latitude',
    'longitude',
    'generic_code',
    'location',
    'region_name',
    'relevance_at_scale',
    'status_term',
    'latdec',
    'londec',
    'datum',
    'feature_id',
    'coord_acc_m',
    'geoname',
    'concise_term',
    'rs_value',
    'concise_code',
    'nts_map',
    'cgndb_key'
    ]
  };
  Atlas.PlaceReader.superclass.constructor.call(this, meta, meta.fields);
};

Ext.extend(Atlas.PlaceReader, Ext.data.JsonReader, {
  read: function(response) {
    var json = response.responseText;
    var o    = Ext.decode(json);
    if(!o) {
      throw {
        message: "JsonReader.read: Json object not found"
      };
    }
    var places = o.SearchResults;
    return this.readRecords(o.SearchResults);
  }
});