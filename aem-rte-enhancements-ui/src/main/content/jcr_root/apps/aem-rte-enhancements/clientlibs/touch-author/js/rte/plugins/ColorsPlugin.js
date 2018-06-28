RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI){
    "use strict";

    RTEExt.rte.plugins.ColorsPlugin = new Class({
        toString: 'ColorsPlugin',

        extend: RTEExt.rte.plugins.FeatureBasedPlugin,

        _initFeatures: function(editorKernel, pluginId){
            this.features = [
                new RTEExt.rte.features.TextColor(editorKernel, this),
                new RTEExt.rte.features.TextHighlight(editorKernel, this)
            ];
        }
    });

    //register plugin
    CUI.rte.plugins.PluginRegistry.register(
        RTEExt.rte.Groups.COLORS, RTEExt.rte.plugins.ColorsPlugin
    );
})(window.CUI);
