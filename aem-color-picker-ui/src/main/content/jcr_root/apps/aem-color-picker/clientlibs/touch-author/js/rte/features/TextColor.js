ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.features = ColorPicker.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'text-color';

    ColorPicker.rte.features.TextColor = new Class({
        toString: 'TextColor',

        extend: ColorPicker.rte.features.Feature,

        ui: null,

        dialog: null,

        savedNativeSelection: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [ColorPicker.rte.commands.TextColor.COMMAND_NAME];
        },

        initializeUI: function(tbGenerator, options){
            var plugins = CUI.rte.plugins;

            tbGenerator.registerIcon(ColorPicker.rte.commands.TextColor.COMMAND_REF, 'textColor');
            tbGenerator.registerAdditionalClasses(ColorPicker.rte.commands.TextColor.COMMAND_REF, 'rte--trigger');

            this.ui = tbGenerator.createElement(this.getName(), this.plugin, true, this.config.tooltip);
            tbGenerator.addElement(this.plugin.pluginId, plugins.Plugin.SORT_EDIT, this.ui, 100);
        },

        notifyConfig: function(config){
            var defaultConfig = {
                'variant': 'default',
                'autogeneratecolors': 'off',
                'showdefaultcolors': 'on',
                'showswatches': 'on',
                'showproperties': 'on',
                'placeholder': '',
                'colors': [],
                'tooltip': {}
            };
            defaultConfig.tooltip = {
                'title': CUI.rte.Utils.i18n(ColorPicker.rte.commands.TextColor.TOOLTIP_KEYS.title),
                'text': CUI.rte.Utils.i18n(ColorPicker.rte.commands.TextColor.TOOLTIP_KEYS.text)
            };
            if(defaultConfig.tooltip.title === ColorPicker.rte.commands.TextColor.TOOLTIP_KEYS.title){
                defaultConfig.tooltip.title = 'Text Color';
            }
            if(defaultConfig.tooltip.text === ColorPicker.rte.commands.TextColor.TOOLTIP_KEYS.text){
                defaultConfig.tooltip.text = 'Text Color';
            }
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;
        },

        execute: function(command, value, envOptions){
            var plugin = this.plugin,
                editorKernel = this.editorKernel,
                editContext = envOptions.editContext,
                dialogManager = editorKernel.getDialogManager(),
                $container = CUI.rte.UIUtils.getUIContainer($(editContext.root)),
                selectionDef = editorKernel.analyzeSelection(editContext),
                textColorConfig = CUI.rte.Utils.copyObject(this.config);

            if(this.dialog && dialogManager.isShown(this.dialog) && dialogManager.toggleVisibility(this.dialog)){
                dialogManager.hide(this.dialog);
            } else {
                if(!this.dialog || dialogManager.mustRecreate(this.dialog)){
                    textColorConfig.execute = function(value){
                        CUI.rte.Selection.restoreNativeSelection(editContext, this.savedNativeSelection);
                        editorKernel.relayCmd(ColorPicker.rte.commands.TextColor.COMMAND_NAME, value);
                    };
                    textColorConfig.parameters = {
                        'command': ColorPicker.rte.commands.TextColor.COMMAND_REF
                    };

                    this.dialog = new ColorPicker.rte.ui.dialogs.TextColor();
                    this.dialog.attach(textColorConfig, $container, editorKernel);
                }

                dialogManager.prepareShow(this.dialog);
                this.dialog.setColor(selectionDef ? ColorPicker.rte.Utils.getComputedStyle(
                    selectionDef.selection, {style: 'color'}, editContext.root
                ) : '');
                this.savedNativeSelection = CUI.rte.Selection.saveNativeSelection(editContext);
                dialogManager.show(this.dialog);
            }
        },

        updateState: function(selDef){
            var selectedColor = ColorPicker.rte.Utils.getSelectionStyle(
                selDef.selection, {style: 'color'}, selDef.editContext.root
            );
            this.ui.setSelected('' !== selectedColor && ColorPicker.rte.Utils.isFullSelection(
                selDef.selection, selDef.editContext.root
            ));
        },

        isHeadless: function(command, value){
            return false;
        }
    });
})(window.CUI);
