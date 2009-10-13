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
      url: Context.path + '/places',
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

    placeNameSearchField.on('triggered', function(text) {
      placeNameStore.load({
        params: { geoname: text }
      });
    });

    this.items = [
    placeNameSearchField,
    new Ext.grid.GridPanel({
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
    })
    ];

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
      if(e.getKey() == e.ENTER) {
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