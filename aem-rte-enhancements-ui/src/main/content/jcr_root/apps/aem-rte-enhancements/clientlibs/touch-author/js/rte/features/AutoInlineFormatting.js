RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'inline';

    RTEExt.rte.features.AutoInlineFormatting = new Class({
        toString: 'AutoInlineFormatting',

        extend: RTEExt.rte.features.Feature,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME];
        },

        notifyConfig: function(config){
            var defaultConfig = {};
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;
        },

        updateState: function(selDef){
            //TODO: implement
        }
    });
})(window.CUI);
