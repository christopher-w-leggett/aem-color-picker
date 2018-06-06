RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'block';

    RTEExt.rte.features.AutoBlockFormatting = new Class({
        toString: 'AutoBlockFormatting',

        extend: RTEExt.rte.features.Feature,

        _activationKey: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [RTEExt.rte.commands.AutoBlockFormatting.COMMAND_NAME];
        },

        notifyConfig: function(config){
            //set config
            var defaultConfig = {
                blockElementMapping: {
                    unorderedList: {
                        keySequence: ['*', '-'],
                        nodeTree: ['ul', 'li']
                    },
                    orderedList: {
                        keySequence: ['1.', '1)'],
                        nodeTree: ['ol', 'li']
                    },
                    h1: {
                        keySequence: ['#'],
                        nodeTree: ['h1']
                    },
                    h2: {
                        keySequence: ['##'],
                        nodeTree: ['h2']
                    },
                    h3: {
                        keySequence: ['###'],
                        nodeTree: ['h3']
                    },
                    h4: {
                        keySequence: ['####'],
                        nodeTree: ['h4']
                    },
                    h5: {
                        keySequence: ['#####'],
                        nodeTree: ['h5']
                    },
                    h6: {
                        keySequence: ['######'],
                        nodeTree: ['h6']
                    },
                    blockquote: {
                        keySequence: ['>'],
                        nodeTree: ['blockquote']
                    }
                }
            };
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;

            //initialize properties
            this._activationKey = ' ';

            //register listeners
            this.editorKernel.addPluginListener('keyup', this._keyup, this, this.plugin, false);
        },

        _keyup: function(event){
            var key = event.nativeEvent.key,
                root = event.editContext.root,
                selection = CUI.rte.Selection.createProcessingSelection(event.editContext),
                cursorNode = selection.startNode,
                elementMappingName,
                elementMapping;

            //see if we are applying formatting
            if(this._activationKey === key && this._canCreateBlockFormatting(cursorNode, root)){
                //find element mapping from our configuration
                elementMappingName = Object.keys(this.config.blockElementMapping).find(function(key){
                    return this.config.blockElementMapping.hasOwnProperty(key)
                        && this.config.blockElementMapping[key].keySequence.includes(
                            cursorNode.textContent.substring(0, cursorNode.textContent.length - 1)
                        );
                }.bind(this));
                elementMapping = elementMappingName ? this.config.blockElementMapping[elementMappingName] : null;

                //modify top level block if we found a mapping
                if(elementMapping){
                    this.editorKernel.relayCmd(RTEExt.rte.commands.AutoBlockFormatting.COMMAND_NAME, {
                        createTree: true,
                        tree: elementMapping.nodeTree
                    });
                }
            } else if('Enter' === key && this._canRemoveBlockFormatting(cursorNode, root)){
                //see if we should remove current formatting
                //find element mapping from our configuration
                elementMappingName = Object.keys(this.config.blockElementMapping).find(function(key){
                    var match = true,
                        curNode = cursorNode.parentNode,
                        i;

                    if(this.config.blockElementMapping.hasOwnProperty(key)){
                        for(i = this.config.blockElementMapping[key].nodeTree.length - 1; match && i >= 0; i--){
                            match = match
                                && this.config.blockElementMapping[key].nodeTree[i] === curNode.tagName.toLowerCase();
                            curNode = curNode.parentNode;
                        }
                        match = match && curNode === root;
                    } else {
                        match = false;
                    }

                    return match;
                }.bind(this));
                elementMapping = elementMappingName ? this.config.blockElementMapping[elementMappingName] : null;

                //modify top level block if we found a mapping
                if(elementMapping){
                    this.editorKernel.relayCmd(RTEExt.rte.commands.AutoBlockFormatting.COMMAND_NAME, {
                        createTree: false,
                        tree: elementMapping.nodeTree
                    });
                }
            }
        },

        _canCreateBlockFormatting: function(node, root){
            var parentNode = node.parentNode;

            return node.nodeType === 3
                && parentNode !== root
                && parentNode.nodeType === 1
                && parentNode.childNodes.length === 1
                && (parentNode.tagName.toLowerCase() === 'p' || parentNode.tagName.toLowerCase() === 'div');
        },

        _canRemoveBlockFormatting: function(node, root){
            //node is empty text node, has no siblings and intermediate parent nodes don't have siblings
            var curNode = node,
                removable = (curNode.nodeType === 3 && curNode.textContent === '') || this._isPlaceholderBr(curNode);

            //check no siblings up to top level block node
            while(removable && curNode.parentNode !== root){
                removable = removable && !curNode.previousSibling && !curNode.nextSibling;
                curNode = curNode.parentNode;
            }

            //check current top level block node isn't already the default
            removable = removable && curNode.tagName.toLowerCase() !== 'p' && curNode.tagName.toLowerCase() !== 'div';

            return removable;
        },

        _isPlaceholderBr: function(node){
            return node.nodeType === 1
                && node.tagName.toLowerCase() === 'br'
                && node.attributes.hasOwnProperty('_rte_temp_br');
        }
    });
})(window.CUI);
