RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI, $){
    "use strict";

    var GROUP = 'auto';

    //TODO: auto#inline (bold, italic, code)
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
        GROUP, RTEExt.rte.plugins.AutoFormatPlugin
    );
})(window.CUI, window.jQuery);
