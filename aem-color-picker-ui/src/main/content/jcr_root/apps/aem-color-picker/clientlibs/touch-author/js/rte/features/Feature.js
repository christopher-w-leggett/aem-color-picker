ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.features = ColorPicker.rte.features || {};
(function(CUI){
    "use strict";

    ColorPicker.rte.features.Feature = new Class({
        toString: 'Feature',

        editorKernel: null,

        plugin: null,

        config: {},

        construct: function (editorKernel, plugin) {
            this.editorKernel = editorKernel;
            this.plugin = plugin;
        },

        getName: function(){
            // must be overridden.
        },

        getCommands: function(){
            // must be overridden.
        },

        initializeUI: function(tbGenerator, options){
            // may be overridden for features with UI elements.
        },

        notifyConfig: function(config){
            // may be overridden to work with configuration options.
            this.config = config;
        },

        execute: function(command, value, envOptions){
            // may be overridden for dialog based features.
        },

        updateState: function(selDef){
            // may be overridden for state updates.
        },

        isHeadless: function(command, value){
            // may be overridden if dialog is used in this feature.  If false, this features execute function will be
            // called.
            return true;
        }
    });
})(window.CUI);
