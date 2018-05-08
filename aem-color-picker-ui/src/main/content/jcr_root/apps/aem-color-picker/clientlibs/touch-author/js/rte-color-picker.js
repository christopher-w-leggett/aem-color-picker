(function(CUI) {
    "use strict";

    var COLOR_PICKER_GROUP = 'colorpicker',
        COLOR_PICKER_FEATURE = 'colorpicker',
        COLOR_PICKER_COMMAND_REF = COLOR_PICKER_GROUP + '#' + COLOR_PICKER_FEATURE,

        //define plugin
        ColorPickerPlugin = new Class({

            toString: 'ColorPickerPlugin',

            extend: CUI.rte.plugins.Plugin,

            colorPickerUI: null,

            getFeatures: function() {
                return [COLOR_PICKER_FEATURE];
            },

            initializeUI: function(tbGenerator, options) {
                var plg = CUI.rte.plugins,
                    ui = CUI.rte.ui,
                    colorpickerTooltip;

                tbGenerator.registerIcon(COLOR_PICKER_COMMAND_REF, 'textColor');
                tbGenerator.registerAdditionalClasses(COLOR_PICKER_COMMAND_REF, 'rte--trigger');

                if (this.isFeatureEnabled(COLOR_PICKER_FEATURE)) {
                    colorpickerTooltip = this.getTooltip('colorpicker');
                    if(colorpickerTooltip.title === 'plugins.colorpicker.colorpickerTitle') {
                        colorpickerTooltip.title = 'Color';
                    }
                    if(colorpickerTooltip.text === 'plugins.colorpicker.colorpickerText') {
                        colorpickerTooltip.text = 'Color';
                    }

                    this.colorPickerUI = tbGenerator.createElement(COLOR_PICKER_FEATURE, this, true, colorpickerTooltip);
                    tbGenerator.addElement(COLOR_PICKER_GROUP, plg.Plugin.SORT_EDIT, this.colorPickerUI, 100);
                }
            },

            notifyPluginConfig: function(pluginConfig) {
                pluginConfig = pluginConfig || {};
                CUI.rte.Utils.applyDefaults(pluginConfig, {
                    'features': '*',
                    'colorPickerDialogConfig': {},
                    'tooltips': {
                        'colorpicker': {
                            'title': CUI.rte.Utils.i18n('plugins.colorpicker.colorpickerTitle'),
                            'text': CUI.rte.Utils.i18n('plugins.colorpicker.colorpickerText')
                        }
                    }
                });
                this.config = pluginConfig;
            },

            execute: function(pluginCommand, value, envOptions) {
                console.log('executed plugin');
            },

            updateState: function(selDef) {
                // must be overridden by implementing plugins
            },

            isHeadless: function(command, value) {
                return false;
            }

        });

    CUI.rte.plugins.PluginRegistry.register(COLOR_PICKER_GROUP, ColorPickerPlugin);
})(window.CUI);
