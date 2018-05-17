RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI, $){
    "use strict";

    var GROUP = 'enforcer';

    RTEExt.rte.plugins.EnforcerPlugin = new Class({
        toString: 'EnforcerPlugin',

        extend: RTEExt.rte.plugins.FeatureBasedPlugin,

        _initFeatures: function(editorKernel, pluginId){
            this.features = [
                new RTEExt.rte.features.EnforceMarkup(editorKernel, this)
            ];
        }
    });

    //register plugin
    CUI.rte.plugins.PluginRegistry.register(
        GROUP, RTEExt.rte.plugins.EnforcerPlugin
    );
})(window.CUI, window.jQuery);
