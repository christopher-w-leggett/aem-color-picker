RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI){
    "use strict";

    RTEExt.rte.plugins.FormatExtPlugin = new Class({
        toString: 'FormatExtPlugin',

        extend: RTEExt.rte.plugins.FeatureBasedPlugin,

        _initFeatures: function(editorKernel, pluginId){
            this.features = [
                new RTEExt.rte.features.FormatExt(editorKernel, this)
            ];
        }
    });

    //register plugin
    CUI.rte.plugins.PluginRegistry.register(
        RTEExt.rte.Groups.FORMAT_EXT, RTEExt.rte.plugins.FormatExtPlugin
    );
})(window.CUI);
