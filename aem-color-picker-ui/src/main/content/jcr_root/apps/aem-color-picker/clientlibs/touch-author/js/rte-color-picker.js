(function(CUI, $){
    "use strict";

    var COLOR_PICKER_GROUP = 'colorpicker',
        COLOR_PICKER_FEATURE = 'colorpicker',
        COLOR_PICKER_COMMAND_NAME = 'colorpicker',
        COLOR_PICKER_COMMAND_REF = COLOR_PICKER_GROUP + '#' + COLOR_PICKER_FEATURE,

        Utils = (function(){
            function getLeftDominantParent(node, rootNode){
                var dominantParent = null,
                    curChild = node,
                    curParent = curChild.parentNode;

                //keep checking parents if we are first child and parent isn't root node.
                while(!curChild.previousSibling && curChild !== rootNode && curParent !== rootNode){
                    //track dominant parent
                    dominantParent = curParent;

                    //set next parent/child
                    curChild = curParent;
                    curParent = curParent.parentNode;
                }

                return dominantParent;
            }

            function getRightDominantParent(node, rootNode){
                var dominantParent = null,
                    curChild = node,
                    curParent = curChild.parentNode;

                //keep checking parents if we are first child and parent isn't root node.
                while(!curChild.nextSibling && curChild !== rootNode && curParent !== rootNode){
                    //track dominant parent
                    dominantParent = curParent;

                    //set next parent/child
                    curChild = curParent;
                    curParent = curParent.parentNode;
                }

                return dominantParent;
            }

            function getColor(node, rootNode){
                var color = '',
                    curNode = node;

                while('' === color && curNode !== rootNode){
                    color = curNode.style ? curNode.style.color : '';
                    curNode = curNode.parentNode;
                }

                return color;
            }

            function isSelection(selectionDef){
                return selectionDef.startNode && selectionDef.endNode;
            }

            function isFullSelection(selectionDef, rootNode){
                var fullSelection = false,
                    leftDominantParent = null,
                    rightDominantParent = null,
                    leftFullSelection,
                    rightFullSelection;

                if(selectionDef.startNode && selectionDef.endNode){
                    leftDominantParent = getLeftDominantParent(selectionDef.startNode, rootNode);
                    rightDominantParent = getRightDominantParent(selectionDef.endNode, rootNode);
                    leftFullSelection = selectionDef.startNode.nodeType !== 3 || selectionDef.startOffset === 0;
                    rightFullSelection = selectionDef.endNode.nodeType !== 3 || selectionDef.endOffset === selectionDef.endNode.length;

                    fullSelection = leftDominantParent !== null && rightDominantParent !== null && leftDominantParent === rightDominantParent
                        && leftFullSelection && rightFullSelection;
                }

                return fullSelection;
            }

            function getSelectedColor(selectionDef, rootNode){
                var color = '',
                    startColor,
                    endColor;

                if(!isSelection(selectionDef)){
                    color = getColor(selectionDef.startNode, rootNode);
                } else {
                    startColor = selectionDef.startNode ? getColor(selectionDef.startNode, rootNode) : '';
                    endColor = selectionDef.endNode ? getColor(selectionDef.endNode, rootNode) : '';
                    if(startColor === endColor){
                        color = startColor;
                    }
                }

                return color;
            }

            return {
                isSelection: isSelection,
                isFullSelection: isFullSelection,
                getSelectedColor: getSelectedColor
            };
        })(),

        //define dialog
        ColorPickerDialog = new Class({

            toString: 'ColorPickerDialog',

            extend: CUI.rte.ui.cui.AbstractBaseDialog,

            colorInput: null,

            applyFunction: null,

            getDataType: function(){
                return 'colorpicker';
            },

            initialize: function(config){
                this.applyFunction = config.execute;
                this.colorInput = this.$container.find('coral-colorinput[data-type="color"]')[0];
            },

            setColor: function(color){
                this.colorInput.value = color || '';
            },

            apply: function(){
                this.applyFunction(this.colorInput.value);
                this.hide();
            },

            onHide: function(){
                this.colorInput.querySelector('coral-overlay').open = false;
            }
        }),

        //define plugin
        ColorPickerPlugin = new Class({

            toString: 'ColorPickerPlugin',

            extend: CUI.rte.plugins.Plugin,

            colorPickerUI: null,

            colorPickerDialog: null,

            savedNativeSelection: null,

            getFeatures: function(){
                return [COLOR_PICKER_FEATURE];
            },

            initializeUI: function(tbGenerator, options){
                var plg = CUI.rte.plugins,
                    ui = CUI.rte.ui,
                    colorpickerTooltip;

                tbGenerator.registerIcon(COLOR_PICKER_COMMAND_REF, 'textColor');
                tbGenerator.registerAdditionalClasses(COLOR_PICKER_COMMAND_REF, 'rte--trigger');

                if (this.isFeatureEnabled(COLOR_PICKER_FEATURE)){
                    colorpickerTooltip = this.getTooltip('colorpicker');
                    if(colorpickerTooltip.title === 'plugins.colorpicker.colorpickerTitle'){
                        colorpickerTooltip.title = 'Color';
                    }
                    if(colorpickerTooltip.text === 'plugins.colorpicker.colorpickerText'){
                        colorpickerTooltip.text = 'Color';
                    }

                    this.colorPickerUI = tbGenerator.createElement(COLOR_PICKER_FEATURE, this, true, colorpickerTooltip);
                    tbGenerator.addElement(COLOR_PICKER_GROUP, plg.Plugin.SORT_EDIT, this.colorPickerUI, 100);
                }
            },

            notifyPluginConfig: function(pluginConfig){
                pluginConfig = pluginConfig || {};
                CUI.rte.Utils.applyDefaults(pluginConfig, {
                    'features': '*',
                    'colorPickerConfig': {
                        'variant': 'default',
                        'autogeneratecolors': 'off',
                        'showdefaultcolors': 'on',
                        'showswatches': 'on',
                        'showproperties': 'on',
                        'colors': []
                    },
                    'tooltips': {
                        'colorpicker': {
                            'title': CUI.rte.Utils.i18n('plugins.colorpicker.colorpickerTitle'),
                            'text': CUI.rte.Utils.i18n('plugins.colorpicker.colorpickerText')
                        }
                    }
                });
                this.config = pluginConfig;
            },

            modifyColor: function(editContext){
                var plugin = this,
                    editorKernel = this.editorKernel,
                    dialogManager = editorKernel.getDialogManager(),
                    $container = CUI.rte.UIUtils.getUIContainer($(editContext.root)),
                    selectionDef = editorKernel.analyzeSelection(editContext),
                    colorPickerConfig = this.config.colorPickerConfig ? CUI.rte.Utils.copyObject(this.config.colorPickerConfig) : {};

                if(this.colorPickerDialog && dialogManager.isShown(this.colorPickerDialog) && dialogManager.toggleVisibility(this.colorPickerDialog)){
                    dialogManager.hide(this.colorPickerDialog);
                } else {
                    if(!this.colorPickerDialog || dialogManager.mustRecreate(this.colorPickerDialog)){
                        colorPickerConfig.execute = function(value){
                            CUI.rte.Selection.restoreNativeSelection(editContext, plugin.savedNativeSelection);
                            editorKernel.relayCmd(COLOR_PICKER_COMMAND_NAME, value);
                        };
                        colorPickerConfig.parameters = {
                            'command': COLOR_PICKER_COMMAND_REF
                        };

                        this.colorPickerDialog = new ColorPickerDialog();
                        this.colorPickerDialog.attach(colorPickerConfig, $container, editorKernel);
                    }

                    dialogManager.prepareShow(this.colorPickerDialog);
                    this.colorPickerDialog.setColor(Utils.getSelectedColor(selectionDef.selection, selectionDef.editContext.root));
                    this.savedNativeSelection = CUI.rte.Selection.saveNativeSelection(editContext);
                    dialogManager.show(this.colorPickerDialog);
                }
            },

            execute: function(pluginCommand, value, envOptions){
                if(pluginCommand === COLOR_PICKER_COMMAND_NAME){
                    this.modifyColor(envOptions.editContext);
                } else {
                    this.editorKernel.relayCmd(pluginCommand);
                }
            },

            updateState: function(selDef){
                var selectedColor = Utils.getSelectedColor(selDef.selection, selDef.editContext.root);
                this.colorPickerUI.setSelected('' !== selectedColor && Utils.isFullSelection(selDef.selection, selDef.editContext.root));
            },

            isHeadless: function(command, value){
                return false;
            }
        }),

        //define command
        ColorPickerCommand = new Class({

            toString: 'ColorPickerCommand',

            extend: CUI.rte.commands.Command,

            isCommand: function(cmdStr){
                return cmdStr.toLowerCase() === COLOR_PICKER_COMMAND_NAME;
            },

            getProcessingOptions: function(){
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
            },

            execute: function(execDef){
                //TODO: Implement coloring
                console.log(execDef);
            }
        });

    //register plugin and command
    CUI.rte.plugins.PluginRegistry.register(COLOR_PICKER_GROUP, ColorPickerPlugin);
    CUI.rte.commands.CommandRegistry.register(COLOR_PICKER_COMMAND_NAME, ColorPickerCommand);

    //register dialog template.
    Coral.templates.RichTextEditor['dlg_colorpicker'] = function(colorPickerConfig){
        var dialogFragment = document.createDocumentFragment();

        //create column container
        var columnContainer = document.createElement('div');
        columnContainer.className = 'rte-dialog-columnContainer';

        //create color input field
        var colorInputColumn = document.createElement('div');
        colorInputColumn.className = 'rte-dialog-column';
        var colorInput = document.createElement('coral-colorinput');
        colorInput.setAttribute('data-type', 'color');
        colorInput.setAttribute('variant', colorPickerConfig.variant);
        if(colorPickerConfig.variant === 'swatch'){
            colorInput.setAttribute('style', 'vertical-align: middle;');
        }
        colorInput.setAttribute('autogeneratecolors', colorPickerConfig.autogeneratecolors);
        colorInput.setAttribute('showdefaultcolors', colorPickerConfig.showdefaultcolors);
        colorInput.setAttribute('showswatches', colorPickerConfig.showswatches);
        colorInput.setAttribute('showproperties', colorPickerConfig.showproperties);
        for(var i = 0; i < colorPickerConfig.colors.length; i++){
            var colorInputItem = document.createElement('coral-colorinput-item');
            colorInputItem.setAttribute('value', colorPickerConfig.colors[i]);
            colorInput.appendChild(colorInputItem);
        }
        colorInputColumn.appendChild(colorInput);
        columnContainer.appendChild(colorInputColumn);

        //create cancel button
        var cancelButtonColumn = document.createElement('div');
        cancelButtonColumn.className = 'rte-dialog-column';
        var cancelButton = document.createElement('button', 'coral-button');
        cancelButton.setAttribute('is', 'coral-button');
        cancelButton.setAttribute('icon', 'close');
        cancelButton.setAttribute('title', CUI.rte.Utils.i18n('dialog.cancel'));
        cancelButton.setAttribute('aria-label', CUI.rte.Utils.i18n('dialog.cancel'));
        cancelButton.setAttribute('iconsize', 'S');
        cancelButton.setAttribute('data-type', 'cancel');
        cancelButton.setAttribute('tabindex', '-1');
        cancelButtonColumn.appendChild(cancelButton);
        columnContainer.appendChild(cancelButtonColumn);

        //create apply button
        var applyButtonColumn = document.createElement('div');
        applyButtonColumn.className = 'rte-dialog-column';
        var applyButton = document.createElement('button', 'coral-button');
        applyButton.setAttribute('is', 'coral-button');
        applyButton.setAttribute('icon', 'check');
        applyButton.setAttribute('title', CUI.rte.Utils.i18n('dialog.apply'));
        applyButton.setAttribute('aria-label', CUI.rte.Utils.i18n('dialog.apply'));
        applyButton.setAttribute('iconsize', 'S');
        applyButton.setAttribute('variant', 'primary');
        applyButton.setAttribute('data-type', 'apply');
        applyButton.setAttribute('tabindex', '-1');
        applyButtonColumn.appendChild(applyButton);
        columnContainer.appendChild(applyButtonColumn);

        //append column container to dialog
        dialogFragment.appendChild(columnContainer);

        return dialogFragment;
    };
})(window.CUI, window.jQuery);