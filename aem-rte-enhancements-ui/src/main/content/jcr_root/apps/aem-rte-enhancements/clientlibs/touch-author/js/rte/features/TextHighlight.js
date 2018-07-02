RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI, $){
    "use strict";

    const NAME = 'text-highlight',
        TOOLTIP_KEYS = {
            'title': 'plugins.' + RTEExt.rte.Groups.COLORS + '.' + NAME + '.title',
            'text': 'plugins.' + RTEExt.rte.Groups.COLORS + '.' + NAME + '.text'
        };

    RTEExt.rte.features.TextHighlight = new Class({
        toString: 'TextHighlight',

        extend: RTEExt.rte.features.Feature,

        ui: null,

        dialog: null,

        savedNativeSelection: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [RTEExt.rte.commands.TextHighlight.COMMAND_NAME];
        },

        initializeUI: function(tbGenerator, options){
            const plugins = CUI.rte.plugins;

            this.ui = tbGenerator.createElement(this.getName(), this.plugin, true, this.config.tooltip);
            tbGenerator.addElement(this.plugin.pluginId, plugins.Plugin.SORT_EDIT, this.ui, 110);
        },

        notifyConfig: function(config){
            const defaultConfig = {
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
                'title': CUI.rte.Utils.i18n(TOOLTIP_KEYS.title),
                'text': CUI.rte.Utils.i18n(TOOLTIP_KEYS.text)
            };
            if(defaultConfig.tooltip.title === TOOLTIP_KEYS.title){
                defaultConfig.tooltip.title = 'Text Highlight';
            }
            if(defaultConfig.tooltip.text === TOOLTIP_KEYS.text){
                defaultConfig.tooltip.text = 'Text Highlight';
            }
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;
        },

        execute: function(command, value, envOptions){
            const editorKernel = this.editorKernel,
                dialogManager = editorKernel.getDialogManager();

            if(this.dialog && dialogManager.isShown(this.dialog) && dialogManager.toggleVisibility(this.dialog)){
                dialogManager.hide(this.dialog);
            } else {
                const editContext = envOptions.editContext,
                    selectionDef = editorKernel.analyzeSelection(editContext);

                if(!this.dialog || dialogManager.mustRecreate(this.dialog)){
                    const textHighlightConfig = CUI.rte.Utils.copyObject(this.config);
                    textHighlightConfig.execute = function(value){
                        CUI.rte.Selection.restoreNativeSelection(editContext, this.savedNativeSelection);
                        editorKernel.relayCmd(RTEExt.rte.commands.TextHighlight.COMMAND_NAME, value);
                    };
                    textHighlightConfig.parameters = {
                        'command': RTEExt.rte.commands.TextHighlight.COMMAND_REF
                    };

                    this.dialog = new RTEExt.rte.ui.dialogs.TextHighlight();
                    this.dialog.attach(
                        textHighlightConfig, CUI.rte.UIUtils.getUIContainer($(editContext.root)), editorKernel
                    );
                }

                dialogManager.prepareShow(this.dialog);
                this.dialog.setColor(selectionDef ? RTEExt.rte.Utils.getComputedStyle(
                    selectionDef.selection, {tagName: 'mark', style: 'background-color'}, editContext.root
                ) : '');
                this.savedNativeSelection = CUI.rte.Selection.saveNativeSelection(editContext);
                dialogManager.show(this.dialog);
            }
        },

        updateState: function(selDef){
            //no need to update ui state because we use a color picker dialog where any applied color is removed by
            //applying no color vs. deselecting a button.
        },

        isHeadless: function(command, value){
            return false;
        }
    });
})(window.CUI, window.jQuery);
