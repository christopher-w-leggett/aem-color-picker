RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
//TODO: Don't allow nested spans.
//TODO: Change so color isn't applied to anything other then injected span tags.  There is issue where converting between p, h1, ul, etc. is removing coloring.
/*
TODO:

Current thought is to create an object that can "format" the selection content.  We might also want a "selection" object
that will take the AEM selection/root node to come up with its own formatting "selection".
*/
(function(CUI){
    "use strict";

    var GROUP = 'colors',
        COMMAND_NAME = 'text-color',
        COMMAND_REF = GROUP + '#' + COMMAND_NAME,
        TOOLTIP_KEYS = {
            'title': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.title',
            'text': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.text'
        };

    RTEExt.rte.commands.TextColor = new Class({
        toString: 'TextColor',

        extend: CUI.rte.commands.Command,

        stripDef: {
            'strip': {
                'tagName': /.*/,
                'styles': {
                    'color': /^((?!^inherit$).)*$/
                }
            },
            'unwrap': {
                'tagName': /span/i
            }
        },

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            if(!RTEExt.rte.Utils.isRangeSelection(execDef.selection)){
                this.colorCursorSelection(execDef);
            } else if(RTEExt.rte.Utils.isFullSelection(execDef.selection, execDef.editContext.root)){
                this.colorFullSelection(execDef);
            } else {
                this.colorRangeSelection(execDef);
            }
        },

        colorCursorSelection: function(execDef){
            var curNode = execDef.selection.startNode,
                nodeToColor = RTEExt.rte.Utils.getClosestStyledNode(
                    curNode, {style: 'color'}, execDef.editContext.root
                );
            while(nodeToColor === null && curNode !== execDef.editContext.root){
                if(curNode.style){
                    nodeToColor = curNode;
                }
                curNode = curNode.parentNode;
            }

            this.colorNode(nodeToColor, execDef.value, execDef.editContext.root);
            if(RTEExt.rte.Utils.canUnwrap(nodeToColor, /span/i)){
                RTEExt.rte.Utils.unwrap(nodeToColor);
            }
        },

        colorFullSelection: function(execDef){
            var sharedDominantParent = RTEExt.rte.Utils.getSharedDominantParent(
                execDef.selection.startNode, execDef.selection.endNode, execDef.editContext.root
            );
            RTEExt.rte.Utils.stripDescendantStyle(sharedDominantParent, this.stripDef);
            this.colorNode(sharedDominantParent, execDef.value, execDef.editContext.root);
            if(RTEExt.rte.Utils.canUnwrap(sharedDominantParent, /span/i)){
                RTEExt.rte.Utils.unwrap(sharedDominantParent);
            }
        },

        colorRangeSelection: function(execDef){
            var actingRoot = RTEExt.rte.Utils.getCommonAncestor(execDef.selection, execDef.editContext.root),
                startDominantParents,
                startNode,
                endDominantParents,
                endNode,
                endNodeParents = [],
                curNode,
                nextNode;

            //determine start node
            if(execDef.selection.startNode.nodeType !== 3 || execDef.selection.startOffset === 0){
                startDominantParents = RTEExt.rte.Utils.getLeftDominantParents(
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
                endDominantParents = RTEExt.rte.Utils.getRightDominantParents(
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
                    nextNode = RTEExt.rte.Utils.getNextRangeSibling(curNode, endNodeParents);
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
                    RTEExt.rte.Utils.stripDescendantStyle(curNode, this.stripDef);
                    this.colorNode(curNode, execDef.value, execDef.editContext.root);
                    if(RTEExt.rte.Utils.canUnwrap(curNode, /span/i)){
                        RTEExt.rte.Utils.unwrap(curNode);
                    }
                }

                //set next node
                curNode = nextNode;
            }
        },

        colorNode: function(node, color, rootNode){
            var coloredParent,
                i,
                links,
                marks;

            if(node && node.style){
                //determine if a parent node contains a color.
                coloredParent = RTEExt.rte.Utils.getClosestStyledNode(
                    node.parentNode, {style: 'color'}, rootNode
                );

                //style node
                if(color !== ''){
                    //any nodes getting a color applied will get the specified color.
                    node.style.color = color;
                } else {
                    //color is being removed, so we must handle special remove logic for certain tags.
                    if(node.tagName.toLowerCase() === 'a'){
                        //links will receive a value of 'inherit' if a parent contains a color.
                        node.style.color = coloredParent ? 'inherit' : '';
                    } else if(node.tagName.toLowerCase() === 'mark'){
                        //marks will always inherit if there isn't a specified color.
                        node.style.color = 'inherit';
                    } else {
                        //all other nodes will have their color removed.
                        node.style.color = '';
                    }
                }

                //style specified descendants
                links = node.querySelectorAll('a');
                for(i = 0; i < links.length; i++){
                    links[i].style.color = color !== '' || coloredParent ? 'inherit' : '';
                }
                marks = node.querySelectorAll('mark');
                for(i = 0; i < marks.length; i++){
                    //descendant marks always get 'inherit' color.
                    marks[i].style.color = 'inherit';
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
                coloredNode.style.color = color;

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

    RTEExt.rte.commands.TextColor.COMMAND_NAME = COMMAND_NAME;
    RTEExt.rte.commands.TextColor.COMMAND_REF = COMMAND_REF;
    RTEExt.rte.commands.TextColor.TOOLTIP_KEYS = TOOLTIP_KEYS;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.TextColor
    );
})(window.CUI);
