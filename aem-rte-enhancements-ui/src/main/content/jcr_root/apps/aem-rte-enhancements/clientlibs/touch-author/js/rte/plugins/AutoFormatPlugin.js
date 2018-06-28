RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI){
    "use strict";

    RTEExt.rte.plugins.AutoFormatPlugin = new Class({
        toString: 'AutoFormatPlugin',

        extend: RTEExt.rte.plugins.FeatureBasedPlugin,

        _initFeatures: function(editorKernel, pluginId){
            this.features = [
                new RTEExt.rte.features.AutoBlockFormatting(editorKernel, this),
                new RTEExt.rte.features.AutoInlineFormatting(editorKernel, this)
            ];
        }
    });

    //register plugin
    CUI.rte.plugins.PluginRegistry.register(
        RTEExt.rte.Groups.AUTO, RTEExt.rte.plugins.AutoFormatPlugin
    );
})(window.CUI);
