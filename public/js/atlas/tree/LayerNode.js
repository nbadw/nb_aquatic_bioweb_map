Ext.ns('Atlas.tree');

Atlas.tree.LayerTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
  url: '/arcserver/soap',

  getParams: function(node) {
    var params = Atlas.tree.LayerTreeLoader.superclass.getParams.apply(this, arguments);
    params += "&rest_url=" + encodeURIComponent(node.attributes.layer.url);
    return params;
  },

  createNode : function(attr) {
    if(this.baseAttrs) {
      Ext.applyIf(attr, this.baseAttrs);
    }
    if(this.applyLoader !== false) {
      attr.loader = this;
    }
    if(typeof attr.uiProvider == 'string') {
      attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
    }
    if(attr.nodeType) {
      return new Ext.tree.TreePanel.nodeTypes[attr.nodeType](attr);
    } else {
      return this.createLegendNode(attr);
    }
  },

  createLegendNode: function(attr) {
    if(attr.legendGroups.length == 1) {
      return new Ext.tree.TreeNode({
        text: attr.name,
        icon: attr.legendGroups[0].legendClasses[0].symbolImage.imageURL
      });
    } else {

    }
  }
});

Atlas.tree.LayerNode = Ext.extend(Ext.tree.AsyncTreeNode, {
  loader: new Atlas.tree.LayerTreeLoader()
});
