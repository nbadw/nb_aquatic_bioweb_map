Ext.ns('Atlas');

Atlas.ContentsInfoWindow = Ext.extend(Ext.Window, {
  layout: 'fit',
  closeAction: 'hide',
  autoScroll: true,
  title: 'Infomation',
  cache: {},
  errorTpl: new Ext.XTemplate('<p class="info-error">An error occured while fetching the requested information.</p>'),
  layerTpl: new Ext.XTemplate(
    '<div class="layer-info">',
      '<p>{[values.description || "No Description Available."]}</p><br/>',
      '<p class="copyright">{values.copyrightText}</p>',
    '</div>'
  ),
  layerInfoTpl: new Ext.XTemplate(
    '<div class="layer-info">',
      '<p>{[values.description || "No Description Available."]}</p><br/>',
      '<p class="copyright">{values.copyrightText}</p>',
    '</div>'
  ),

  displayInfo: function(node) {
    this.on('show', function() {
      this.showLoadMask();
      this.cache[node] ? this.renderInfo(node) : this.requestInfo(node);
    }, this, { single: true });
    this.show(node.getUI().getEl());
  },
  
  renderInfo: function(node) {
    var tpl = node.attributes.layerInfo ? this.layerInfoTpl : this.layerTpl;
    this.applyTemplate(tpl, this.cache[node]);
  },

  applyTemplate: function(tpl, values) {
    //console.log(values);
    tpl.overwrite(this.body, values);
    this.hideLoadMask();
  },

  requestInfo: function(node) {
    var infoUrl = node.attributes.layer.url;
    if(node.attributes.layerInfo) {
      infoUrl += '/' + node.attributes.layerInfo.id;
    }

    Ext.Ajax.request({
      url: '/info',
      params: { url: infoUrl },
      success: function(response) {
        this.cache[node] = Ext.decode(response.responseText);
        this.renderInfo(node);
      },
      failure: this.requestFailed,
      scope: this
    });
  },

  requestFailed: function() {
    this.applyTemplate(this.errorTpl);
  },

  showLoadMask: function() {
    if(!this.loadMask) {
      this.loadMask = new Ext.LoadMask(this.body);
    }
    this.loadMask.show();
  },

  hideLoadMask: function() {
    this.loadMask.hide();
  }
});