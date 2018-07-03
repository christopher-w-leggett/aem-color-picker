RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI){
    "use strict";

    //TODO: Remove word characters like smart quotes, etc.  Configuration could provide characters with replacements.
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
        RTEExt.rte.Groups.ENFORCER, RTEExt.rte.plugins.EnforcerPlugin
    );
})(window.CUI);
