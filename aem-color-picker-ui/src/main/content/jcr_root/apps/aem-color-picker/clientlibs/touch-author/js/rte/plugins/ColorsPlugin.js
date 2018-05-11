ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.plugins = ColorPicker.rte.plugins || {};
(function(CUI, $){
    "use strict";

    var GROUP = 'colors',
        TEXT_COLOR_FEATURE = 'text-color';

    ColorPicker.rte.plugins.ColorsPlugin = new Class({
        toString: 'ColorsPlugin',

        extend: CUI.rte.plugins.Plugin,

        uis: new Map(),

        dialogs: new Map(),

        savedNativeSelection: null,

        getFeatures: function(){
            return [TEXT_COLOR_FEATURE];
        },

        initializeUI: function(tbGenerator, options){
            var plg = CUI.rte.plugins,
                ui = CUI.rte.ui,
                textColorTooltip,
                textColorUI;

            tbGenerator.registerIcon(ColorPicker.rte.commands.TextColor.COMMAND_REF, 'textColor');
            tbGenerator.registerAdditionalClasses(ColorPicker.rte.commands.TextColor.COMMAND_REF, 'rte--trigger');

            if (this.isFeatureEnabled(TEXT_COLOR_FEATURE)){
                textColorTooltip = this.getTooltip(TEXT_COLOR_FEATURE);
                if(textColorTooltip.title === 'plugins.colors.textColorTitle'){
                    textColorTooltip.title = 'Text Color';
                }
                if(textColorTooltip.text === 'plugins.colors.textColorText'){
                    textColorTooltip.text = 'Text Color';
                }

                textColorUI = tbGenerator.createElement(TEXT_COLOR_FEATURE, this, true, textColorTooltip);
                this.uis.set(TEXT_COLOR_FEATURE, {
                    'ui': textColorUI,
                    'updater': function(selDef){
                        var selectedColor = ColorPicker.rte.Utils.getSelectionColor(
                            selDef.selection, selDef.editContext.root
                        );
                        this.setSelected('' !== selectedColor && ColorPicker.rte.Utils.isFullSelection(
                            selDef.selection, selDef.editContext.root
                        ));
                    }.bind(textColorUI)
                });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_EDIT, textColorUI, 100);
            }
        },

        notifyPluginConfig: function(pluginConfig){
            pluginConfig = pluginConfig || {};
            var defaultConfig = {
                'features': '*',
                'tooltips': {}
            };
            defaultConfig[TEXT_COLOR_FEATURE] = {
                'variant': 'default',
                'autogeneratecolors': 'off',
                'showdefaultcolors': 'on',
                'showswatches': 'on',
                'showproperties': 'on',
                'placeholder': '',
                'colors': []
            };
            defaultConfig.tooltips[TEXT_COLOR_FEATURE] = {
                'title': CUI.rte.Utils.i18n('plugins.colors.' + TEXT_COLOR_FEATURE + '.title'),
                'text': CUI.rte.Utils.i18n('plugins.colors.' + TEXT_COLOR_FEATURE + '.text')
            };
            CUI.rte.Utils.applyDefaults(pluginConfig, defaultConfig);
            this.config = pluginConfig;
        },

        modifyTextColor: function(editContext){
            var plugin = this,
                editorKernel = this.editorKernel,
                dialogManager = editorKernel.getDialogManager(),
                $container = CUI.rte.UIUtils.getUIContainer($(editContext.root)),
                selectionDef = editorKernel.analyzeSelection(editContext),
                textColorConfig = this.config[TEXT_COLOR_FEATURE]
                    ? CUI.rte.Utils.copyObject(this.config[TEXT_COLOR_FEATURE])
                    : {},
                textColorDialog = this.dialogs.get(TEXT_COLOR_FEATURE);

            if(textColorDialog && dialogManager.isShown(textColorDialog) && dialogManager.toggleVisibility(textColorDialog)){
                dialogManager.hide(textColorDialog);
            } else {
                if(!textColorDialog || dialogManager.mustRecreate(textColorDialog)){
                    textColorConfig.execute = function(value){
                        CUI.rte.Selection.restoreNativeSelection(editContext, plugin.savedNativeSelection);
                        editorKernel.relayCmd(ColorPicker.rte.commands.TextColor.COMMAND_NAME, value);
                    };
                    textColorConfig.parameters = {
                        'command': ColorPicker.rte.commands.TextColor.COMMAND_REF
                    };

                    textColorDialog = new ColorPicker.rte.ui.dialogs.TextColor();
                    textColorDialog.attach(textColorConfig, $container, editorKernel);
                    this.dialogs.set(TEXT_COLOR_FEATURE, textColorDialog);
                }

                dialogManager.prepareShow(textColorDialog);
                textColorDialog.setColor(
                    selectionDef ? ColorPicker.rte.Utils.getComputedColor(selectionDef.selection) : ''
                );
                this.savedNativeSelection = CUI.rte.Selection.saveNativeSelection(editContext);
                dialogManager.show(textColorDialog);
            }
        },

        execute: function(pluginCommand, value, envOptions){
            if(pluginCommand === ColorPicker.rte.commands.TextColor.COMMAND_NAME){
                this.modifyTextColor(envOptions.editContext);
            } else {
                this.editorKernel.relayCmd(pluginCommand);
            }
        },

        updateState: function(selDef){
            for(var value of this.uis.values()){
                value.updater(selDef);
            }
        },

        isHeadless: function(command, value){
            return false;
        }
    });

    //register plugin
    CUI.rte.plugins.PluginRegistry.register(
        GROUP, ColorPicker.rte.plugins.ColorsPlugin
    );
})(window.CUI, window.jQuery);
