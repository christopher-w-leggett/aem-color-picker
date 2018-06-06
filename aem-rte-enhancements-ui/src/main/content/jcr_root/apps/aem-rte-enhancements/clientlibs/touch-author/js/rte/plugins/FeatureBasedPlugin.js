RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.plugins = RTEExt.rte.plugins || {};
(function(CUI, $){
    "use strict";

    /*
        TODO: Feature ideas:
        format-ext#strikethrough (.coral3-Icon--textStrikethrough), format-ext#code (.coral3-Icon--code)
        font#size (.coral3-Icon--textSize or .coral3-Icon--textDecrease or .coral3-Icon--textIncrease), font#family,

        Choosing tag for bold (strong), italic (em).  For ADA.
    */
    RTEExt.rte.plugins.FeatureBasedPlugin = new Class({
        toString: 'FeatureBasedPlugin',

        extend: CUI.rte.plugins.Plugin,

        features: [],

        construct: function (editorKernel, pluginId) {
            this._init(editorKernel, pluginId);
            this._initFeatures(editorKernel, pluginId);
        },

        _initFeatures: function(editorKernel, pluginId){
            // must be overridden to initialize features.
        },

        getFeatures: function(){
            return this.features.map(function(feature){
                return feature.getName();
            });
        },

        initializeUI: function(tbGenerator, options){
            this.features.forEach(function(feature){
                if(this.isFeatureEnabled(feature.getName())){
                    feature.initializeUI(tbGenerator, options);
                }
            }, this);
        },

        notifyPluginConfig: function(pluginConfig){
            var config = pluginConfig || {},
                defaultConfig = {
                    'features': '*'
                };
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;

            this.features.forEach(function(feature){
                if(this.isFeatureEnabled(feature.getName())){
                    feature.notifyConfig(this.config[feature.getName()] || {});
                }
            }, this);
        },

        execute: function(pluginCommand, value, envOptions){
            var feature = this.features.find(function(feature){
                return feature.getCommands().includes(pluginCommand);
            }, this);

            if(feature && !feature.isHeadless(pluginCommand, value)){
                feature.execute(pluginCommand, value, envOptions);
            } else {
                this.editorKernel.relayCmd(pluginCommand);
            }
        },

        updateState: function(selDef){
            this.features.forEach(function(feature){
                if(this.isFeatureEnabled(feature.getName())){
                    feature.updateState(selDef);
                }
            }, this);
        },

        isHeadless: function(command, value){
            var feature = this.features.find(function(feature){
                return feature.getCommands().includes(command);
            }, this);

            return !feature || feature.isHeadless(command, value);
        }
    });
})(window.CUI, window.jQuery);
