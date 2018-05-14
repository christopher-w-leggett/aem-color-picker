ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.features = ColorPicker.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'text-highlight';

    ColorPicker.rte.features.TextHighlight = new Class({
        toString: 'TextHighlight',

        extend: ColorPicker.rte.features.Feature,

        ui: null,

        dialog: null,

        savedNativeSelection: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [ColorPicker.rte.commands.TextHighlight.COMMAND_NAME];
        },

        initializeUI: function(tbGenerator, options){
            var plugins = CUI.rte.plugins,
                tooltip;

            tbGenerator.registerIcon(ColorPicker.rte.commands.TextHighlight.COMMAND_REF, 'textEdit');
            tbGenerator.registerAdditionalClasses(ColorPicker.rte.commands.TextHighlight.COMMAND_REF, 'rte--trigger');

            tooltip = this.getTooltip(ColorPicker.rte.commands.TextHighlight.COMMAND_NAME);
            if(tooltip.title === ColorPicker.rte.commands.TextHighlight.TOOLTIP_KEYS.title){
                tooltip.title = 'Text Highlight';
            }
            if(tooltip.text === ColorPicker.rte.commands.TextHighlight.TOOLTIP_KEYS.text){
                tooltip.text = 'Text Highlight';
            }

            this.ui = tbGenerator.createElement(this.getName(), this.plugin, true, tooltip);
            tbGenerator.addElement(this.plugin.pluginId, plugins.Plugin.SORT_EDIT, this.ui, 110);
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
                'tooltips': {}
            };
            defaultConfig.tooltips[ColorPicker.rte.commands.TextHighlight.COMMAND_NAME] = {
                'title': CUI.rte.Utils.i18n(ColorPicker.rte.commands.TextHighlight.TOOLTIP_KEYS.title),
                'text': CUI.rte.Utils.i18n(ColorPicker.rte.commands.TextHighlight.TOOLTIP_KEYS.text)
            };
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
                textHighlightConfig = CUI.rte.Utils.copyObject(this.config);

            if(this.dialog && dialogManager.isShown(this.dialog) && dialogManager.toggleVisibility(this.dialog)){
                dialogManager.hide(this.dialog);
            } else {
                if(!this.dialog || dialogManager.mustRecreate(this.dialog)){
                    textHighlightConfig.execute = function(value){
                        CUI.rte.Selection.restoreNativeSelection(editContext, this.savedNativeSelection);
                        editorKernel.relayCmd(ColorPicker.rte.commands.TextHighlight.COMMAND_NAME, value);
                    };
                    textHighlightConfig.parameters = {
                        'command': ColorPicker.rte.commands.TextHighlight.COMMAND_REF
                    };

                    this.dialog = new ColorPicker.rte.ui.dialogs.TextHighlight();
                    this.dialog.attach(textHighlightConfig, $container, editorKernel);
                }

                dialogManager.prepareShow(this.dialog);
                this.dialog.setColor(selectionDef ? ColorPicker.rte.Utils.getComputedStyle(
                    selectionDef.selection, {tagName: 'mark', style: 'background-color'}, editContext.root
                ) : '');
                this.savedNativeSelection = CUI.rte.Selection.saveNativeSelection(editContext);
                dialogManager.show(this.dialog);
            }
        },

        updateState: function(selDef){
            var cursorAncestors = [],
                dominantMark = null,
                i;

            if(ColorPicker.rte.Utils.isFullSelection(selDef.selection, selDef.editContext.root)){
                dominantMark = ColorPicker.rte.Utils.getSharedDominantParent(
                    selDef.selection.startNode, selDef.selection.endNode, selDef.editContext.root, 'mark'
                );
            } else if(selDef.selection.startNode && !selDef.selection.endNode){
                dominantMark = ColorPicker.rte.Utils.findAncestorTag(
                    selDef.selection.startNode, 'mark', selDef.editContext.root
                );
            }

            this.ui.setSelected(dominantMark !== null);
        },

        isHeadless: function(command, value){
            return false;
        }
    });
})(window.CUI);
