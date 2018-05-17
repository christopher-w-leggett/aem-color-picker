RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI, $){
    "use strict";

    var GROUP = 'colors';

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
        GROUP, RTEExt.rte.plugins.ColorsPlugin
    );
})(window.CUI, window.jQuery);
