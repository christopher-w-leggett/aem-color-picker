(function(CUI, $){
    "use strict";

    var COLOR_PICKER_GROUP = 'colorpicker',
        COLOR_PICKER_FEATURE = 'colorpicker',
        COLOR_PICKER_COMMAND_NAME = 'colorpicker',
        COLOR_PICKER_COMMAND_REF = COLOR_PICKER_GROUP + '#' + COLOR_PICKER_FEATURE,

        Utils = (function(){
            /**
             * Gets the dominant parent nodes to the left of the provided node.  A left most dominant parent is one that
             * considers the provided node as the first child conceptually.
             */
            function getLeftDominantParents(node, rootNode){
                var dominantParents = [],
                    curChild = node,
                    curParent = curChild.parentNode;

                //keep checking parents if we are first child and parent isn't root node.
                while(!curChild.previousSibling && curChild !== rootNode && curParent !== rootNode){
                    //track dominant parent
                    dominantParents.push(curParent);

                    //set next parent/child
                    curChild = curParent;
                    curParent = curParent.parentNode;
                }

                return dominantParents;
            }

            /**
             * Gets the dominant parent nodes to the right of the provided node.  A right most dominant parent is one that
             * considers the provided node as the last child conceptually.
             */
            function getRightDominantParents(node, rootNode){
                var dominantParents = [],
                    curChild = node,
                    curParent = curChild.parentNode;

                //keep checking parents if we are first child and parent isn't root node.
                while(!curChild.nextSibling && curChild !== rootNode && curParent !== rootNode){
                    //track dominant parent
                    dominantParents.push(curParent);

                    //set next parent/child
                    curChild = curParent;
                    curParent = curParent.parentNode;
                }

                return dominantParents;
            }

            /**
             * Gets the dominant parent that is shared between the startNode and endNode.  The dominant parent will
             * consider the startNode as the first child and the endNode as the last child conceptually.
             */
            function getSharedDominantParent(startNode, endNode, rootNode){
                var leftDominantParents = getLeftDominantParents(startNode, rootNode),
                    rightDominantParents = getRightDominantParents(endNode, rootNode),
                    sharedDominantParent = null,
                    leftIndex = leftDominantParents.length - 1,
                    rightIndex = rightDominantParents.length - 1;

                while(sharedDominantParent === null && leftIndex > -1){
                    if(leftDominantParents[leftIndex] === rightDominantParents[rightIndex]){
                        sharedDominantParent = leftDominantParents[leftIndex];
                    }

                    //move to next set of checks
                    if(rightIndex > 0){
                        rightIndex--;
                    } else {
                        leftIndex--;
                        rightIndex = rightDominantParents.length - 1;
                    }
                }

                return sharedDominantParent;
            }

            /**
             * Gets the closest defined color starting from the provided node and working up the parent tree.
             */
            function getClosestColor(node, rootNode){
                var color = '',
                    curNode = node;

                while('' === color && curNode !== rootNode){
                    color = curNode.style ? curNode.style.color : '';
                    curNode = curNode.parentNode;
                }

                return color;
            }

            /**
             * Gets the closest node with a defined color starting from the provided node and working up the parent tree.
             */
            function getClosestColoredNode(node, rootNode){
                var coloredNode = null,
                    curNode = node;

                while(null === coloredNode && curNode !== rootNode){
                    coloredNode = curNode.style && curNode.style.color !== '' ? curNode : null;
                    curNode = curNode.parentNode;
                }

                return coloredNode;
            }

            /**
             * Determines if the provided selection consists of a range or a single cursor position.
             */
            function isRangeSelection(selectionDef){
                return selectionDef.startNode && selectionDef.endNode;
            }

            /**
             * Determines if the provided selection consists of the entire contents of a common parent element.  This
             * means that the start node and end node share a common parent, the start node is at the beginning of that
             * common parent and the end node is at the end of that common parent.  The start/end nodes do not need to
             * be the first/last child of the common parent and can be the first/last child conceptually.
             */
            function isFullSelection(selectionDef, rootNode){
                var fullSelection = false,
                    sharedDominantParent,
                    leftFullSelection,
                    rightFullSelection;

                if(selectionDef.startNode && selectionDef.endNode){
                    sharedDominantParent = getSharedDominantParent(
                        selectionDef.startNode, selectionDef.endNode, rootNode
                    );
                    leftFullSelection = selectionDef.startNode.nodeType !== 3 || selectionDef.startOffset === 0;
                    rightFullSelection = selectionDef.endNode.nodeType !== 3 || selectionDef.endOffset === selectionDef.endNode.length;

                    fullSelection = sharedDominantParent !== null && leftFullSelection && rightFullSelection;
                }

                return fullSelection;
            }

            /**
             * Gets the color of the current selection.
             * If the selection isn't a range, it will find the color of the closest colored parent node.
             * If the selection is a range, it will find the color of the closest parent at the start of the range and
             * at the end of the range.  If the start and end colors match, that color will be returned.
             */
            function getSelectedColor(selectionDef, rootNode){
                var color = '',
                    startColor,
                    endColor;

                if(!isRangeSelection(selectionDef)){
                    color = getClosestColor(selectionDef.startNode, rootNode);
                } else {
                    startColor = selectionDef.startNode ? getClosestColor(selectionDef.startNode, rootNode) : '';
                    endColor = selectionDef.endNode ? getClosestColor(selectionDef.endNode, rootNode) : '';
                    if(startColor === endColor){
                        color = startColor;
                    }
                }

                return color;
            }

            /**
             * Unwraps the provided node by moving all children to its parent and finally removing the provided node.
             */
            function unwrap(node){
                var parentNode = node.parentNode;

                while(node.firstChild){
                    parentNode.insertBefore(node.firstChild, node);
                }

                parentNode.removeChild(node);
            }

            /**
             * Determines if provided node is a span tag.
             */
            function isSpan(node){
                return node.tagName && node.tagName.toLowerCase() === 'span';
            }

            /**
             * Determines if the provided nodes attribute list is empty.
             */
            function hasNoAttributes(node){
                return !node.attributes || node.attributes.length === 0;
            }

            /**
             * Determines if the provided node contains only a single style attribute with no value.
             */
            function hasOnlyEmptyStyleAttribute(node){
                return node.attributes
                    && node.attributes.length === 1
                    && node.attributes[0].nodeName === 'style'
                    && node.attributes[0].value === '';
            }

            /**
             * Determines if the node can be unwrapped.  This is true if the node is a coloring node.
             */
            function canUnwrap(node){
                return isSpan(node) && (hasNoAttributes(node) || hasOnlyEmptyStyleAttribute(node));
            }

            /**
             * Strips all coloring markup for descendant nodes.
             */
            function stripDescendantColors(node){
                var curChild = node.firstChild,
                    markerNode;

                while(curChild){
                    if(curChild.style){
                        curChild.style.color = '';
                    }

                    if(canUnwrap(curChild)){
                        markerNode = curChild.previousSibling || node;
                        unwrap(curChild);
                        curChild = markerNode === node ? markerNode.firstChild : markerNode.nextSibling;
                    }else{
                        curChild = curChild.nextSibling;
                    }
                }
            }

            function getNextRangeSibling(node, endTree){
                var curNode = node,
                    nextSibling = curNode.nextSibling;

                //move to next conceptual sibling which could be our parents sibling.
                while(!nextSibling && !endTree.includes(curNode)){
                    curNode = curNode.parentNode;
                    nextSibling = curNode.nextSibling;
                }

                //if next sibling represents the end tree, move down
                while(endTree.includes(nextSibling)){
                    nextSibling = nextSibling.firstChild;
                }

                return nextSibling;
            }

            return {
                getLeftDominantParents: getLeftDominantParents,
                getRightDominantParents: getRightDominantParents,
                isRangeSelection: isRangeSelection,
                isFullSelection: isFullSelection,
                getSelectedColor: getSelectedColor,
                getClosestColoredNode: getClosestColoredNode,
                getSharedDominantParent: getSharedDominantParent,
                stripDescendantColors: stripDescendantColors,
                getNextRangeSibling: getNextRangeSibling
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
                    this.colorPickerDialog.setColor(
                        selectionDef ? Utils.getSelectedColor(selectionDef.selection, selectionDef.editContext.root) : ''
                    );
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
                this.colorPickerUI.setSelected(
                    '' !== selectedColor && Utils.isFullSelection(selDef.selection, selDef.editContext.root)
                );
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
                console.log(execDef);
                if(!Utils.isRangeSelection(execDef.selection)){
                    this.colorCursorSelection(execDef);
                } else if(Utils.isFullSelection(execDef.selection, execDef.editContext.root)){
                    this.colorFullSelection(execDef);
                } else {
                    this.colorRangeSelection(execDef);
                }
            },

            colorCursorSelection: function(execDef){
                var curNode = execDef.selection.startNode,
                    nodeToColor = Utils.getClosestColoredNode(curNode, execDef.editContext.root);
                while(nodeToColor === null && curNode !== execDef.editContext.root){
                    if(curNode.style){
                        nodeToColor = curNode;
                    }
                }

                this.colorNode(nodeToColor, execDef.value);
            },

            colorFullSelection: function(execDef){
                var sharedDominantParent = Utils.getSharedDominantParent(
                    execDef.selection.startNode, execDef.selection.endNode, execDef.editContext.root
                );
                Utils.stripDescendantColors(sharedDominantParent);
                this.colorNode(sharedDominantParent, execDef.value);
            },

            colorRangeSelection: function(execDef){
                var actingRoot = execDef.nodeList.commonAncestor,
                    startDominantParents,
                    startNode,
                    endDominantParents,
                    endNode,
                    endNodeParents = [],
                    curNode,
                    nextNode;

                //determine start node
                if(execDef.selection.startNode.nodeType !== 3 || execDef.selection.startOffset === 0){
                    startDominantParents = Utils.getLeftDominantParents(execDef.selection.startNode, actingRoot);
                    if(startDominantParents.length){
                        startNode = startDominantParents.pop();
                    } else {
                        startNode = execDef.selection.startNode;
                    }
                } else {
                    startNode = execDef.selection.startNode;
                }

                //determine end node
                if(execDef.selection.endNode.nodeType !== 3 || execDef.selection.endOffset === execDef.selection.endNode.length){
                    endDominantParents = Utils.getRightDominantParents(execDef.selection.endNode, actingRoot);
                    if(endDominantParents.length){
                        endNode = endDominantParents.pop();
                    } else {
                        endNode = execDef.selection.endNode;
                    }
                } else {
                    endNode = execDef.selection.endNode;
                }

                //populate end node parents so we can quickly determine if we need to recurse into a tree.
                curNode = endNode;
                while(curNode.parentNode !== actingRoot){
                    endNodeParents.push(curNode.parentNode);
                    curNode = curNode.parentNode;
                }

                //recurse across selection and style
                curNode = startNode;
                while(curNode){
                    //determine next node
                    if(curNode !== endNode){
                        nextNode = Utils.getNextRangeSibling(curNode, endNodeParents);
                    } else {
                        //stop as we are at the end
                        nextNode = null;
                    }

                    //style current node
                    if(curNode.nodeType === 3){
                        this.colorTextNode(
                            curNode,
                            curNode === startNode ? execDef.selection.startOffset : 0,
                            curNode === endNode ? execDef.selection.endOffset : curNode.length,
                            execDef.value
                        );
                    } else {
                        Utils.stripDescendantColors(curNode);
                        this.colorNode(curNode, execDef.value);
                    }

                    //set next node
                    curNode = nextNode;
                }
            },

            colorNode: function(node, color){
                if(node && node.style){
                    node.style.color = color || '';
                }
            },

            colorTextNode: function(node, startIndex, endIndex, color){
                var parentNode = node.parentNode,
                    coloredNode,
                    startTextNode,
                    coloredTextNode,
                    endTextNode;

                if(node && node.nodeType === 3){
                    //split out text
                    startTextNode = startIndex > 0
                        ? document.createTextNode(node.textContent.substring(0, startIndex))
                        : null;
                    coloredTextNode = document.createTextNode(node.textContent.substring(startIndex, endIndex));
                    endTextNode = endIndex < node.textContent.length
                        ? document.createTextNode(node.textContent.substring(endIndex))
                        : null;

                    //create container
                    coloredNode = document.createElement('span');
                    coloredNode.appendChild(coloredTextNode);
                    this.colorNode(coloredNode, color);

                    //append new markup
                    if(startTextNode){
                        parentNode.insertBefore(startTextNode, node);
                    }
                    parentNode.insertBefore(coloredNode, node);
                    if(endTextNode){
                        parentNode.insertBefore(endTextNode, node);
                    }

                    //remove old markup
                    parentNode.removeChild(node);
                }
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
