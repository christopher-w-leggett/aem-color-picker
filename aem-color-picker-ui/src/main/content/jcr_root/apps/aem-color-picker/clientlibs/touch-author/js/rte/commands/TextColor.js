ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.commands = ColorPicker.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'colors',
        COMMAND_NAME = 'text-color',
        COMMAND_REF = GROUP + '#' + COMMAND_NAME;

    ColorPicker.rte.commands.TextColor = new Class({
        toString: 'TextColor',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            if(!ColorPicker.rte.Utils.isRangeSelection(execDef.selection)){
                this.colorCursorSelection(execDef);
            } else if(ColorPicker.rte.Utils.isFullSelection(execDef.selection, execDef.editContext.root)){
                this.colorFullSelection(execDef);
            } else {
                this.colorRangeSelection(execDef);
            }
        },

        colorCursorSelection: function(execDef){
            var curNode = execDef.selection.startNode,
                nodeToColor = ColorPicker.rte.Utils.getClosestColoredNode(curNode, execDef.editContext.root);
            while(nodeToColor === null && curNode !== execDef.editContext.root){
                if(curNode.style){
                    nodeToColor = curNode;
                }
                curNode = curNode.parentNode;
            }

            this.colorNode(nodeToColor, execDef.value);
            if(ColorPicker.rte.Utils.canUnwrap(nodeToColor)){
                ColorPicker.rte.Utils.unwrap(nodeToColor);
            }
        },

        colorFullSelection: function(execDef){
            var sharedDominantParent = ColorPicker.rte.Utils.getSharedDominantParent(
                execDef.selection.startNode, execDef.selection.endNode, execDef.editContext.root
            );
            ColorPicker.rte.Utils.stripDescendantColors(sharedDominantParent);
            this.colorNode(sharedDominantParent, execDef.value);
            if(ColorPicker.rte.Utils.canUnwrap(sharedDominantParent)){
                ColorPicker.rte.Utils.unwrap(sharedDominantParent);
            }
        },

        colorRangeSelection: function(execDef){
            var actingRoot = ColorPicker.rte.Utils.getCommonAncestor(execDef.selection, execDef.editContext.root),
                startDominantParents,
                startNode,
                endDominantParents,
                endNode,
                endNodeParents = [],
                curNode,
                nextNode;

            //determine start node
            if(execDef.selection.startNode.nodeType !== 3 || execDef.selection.startOffset === 0){
                startDominantParents = ColorPicker.rte.Utils.getLeftDominantParents(
                    execDef.selection.startNode, actingRoot
                );
                if(startDominantParents.length){
                    startNode = startDominantParents.pop();
                } else {
                    startNode = execDef.selection.startNode;
                }
            } else {
                startNode = execDef.selection.startNode;
            }

            //determine end node
            if(execDef.selection.endNode.nodeType !== 3
                || execDef.selection.endOffset === execDef.selection.endNode.length){
                endDominantParents = ColorPicker.rte.Utils.getRightDominantParents(
                    execDef.selection.endNode, actingRoot
                );
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
                    nextNode = ColorPicker.rte.Utils.getNextRangeSibling(curNode, endNodeParents);
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
                    ColorPicker.rte.Utils.stripDescendantColors(curNode);
                    this.colorNode(curNode, execDef.value);
                    if(ColorPicker.rte.Utils.canUnwrap(curNode)){
                        ColorPicker.rte.Utils.unwrap(curNode);
                    }
                }

                //set next node
                curNode = nextNode;
            }
        },

        colorNode: function(node, color){
            var i,
                links;

            if(node && node.style){
                node.style.color = color || '';

                //style any contained links
                links = node.querySelectorAll('a');
                for(i = 0; i < links.length; i++){
                    links[i].style.color = color || '';
                }
            }
        },

        colorTextNode: function(node, startIndex, endIndex, color){
            var parentNode = node.parentNode,
                coloredNode,
                startTextNode,
                coloredTextNode,
                endTextNode;

            if(node && node.nodeType === 3 && color !== ''){
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

    ColorPicker.rte.commands.TextColor.COMMAND_NAME = COMMAND_NAME;
    ColorPicker.rte.commands.TextColor.COMMAND_REF = COMMAND_REF;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, ColorPicker.rte.commands.TextColor
    );
})(window.CUI);
