RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
//TODO: Don't allow nested mark tags
(function(CUI){
    "use strict";

    var GROUP = 'colors',
        COMMAND_NAME = 'text-highlight',
        COMMAND_REF = GROUP + '#' + COMMAND_NAME,
        TOOLTIP_KEYS = {
            'title': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.title',
            'text': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.text'
        };

    RTEExt.rte.commands.TextHighlight = new Class({
        toString: 'TextHighlight',

        extend: CUI.rte.commands.Command,

        stripDef: {
            'strip': {
                'tagName': /mark/i,
                'styles': {
                    'background-color': /.*/,
                    'color': /^inherit$/
                }
            },
            'unwrap': {
                'tagName': /mark/i
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
                this.highlightCursorSelection(execDef);
            } else if(RTEExt.rte.Utils.isFullSelection(execDef.selection, execDef.editContext.root)){
                this.highlightFullSelection(execDef);
            } else {
                this.highlightRangeSelection(execDef);
            }
        },

        highlightCursorSelection: function(execDef){
            var ancestorMark = RTEExt.rte.Utils.findAncestorTag(
                execDef.selection.startNode, 'mark', execDef.editContext.root
            );
            if(ancestorMark !== null){
                this.styleMark(ancestorMark, execDef.value);
            }
        },

        highlightFullSelection: function(execDef){
            var dominantMark = RTEExt.rte.Utils.getSharedDominantParent(
                    execDef.selection.startNode, execDef.selection.endNode, execDef.editContext.root, 'mark'
                ),
                sharedParent = RTEExt.rte.Utils.getSharedParent(
                    execDef.selection.startNode, execDef.selection.endNode, execDef.editContext.root
                );
            if(dominantMark !== null){
                this.removeDescendantMarks(dominantMark);
                this.styleMark(dominantMark, execDef.value);
            } else {
                this.removeDescendantMarks(sharedParent);
                this.markNode(sharedParent, execDef.value);
            }
        },

        highlightRangeSelection: function(execDef){
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
                    this.markTextNode(
                        curNode,
                        curNode === startNode ? execDef.selection.startOffset : 0,
                        curNode === endNode ? execDef.selection.endOffset : curNode.length,
                        execDef.value
                    );
                } else {
                    this.removeDescendantMarks(curNode);
                    this.markNode(curNode, execDef.value);
                }

                //set next node
                curNode = nextNode;
            }
        },

        markNode: function(node, color){
            var i;

            if(node){
                if(node.nodeType === 3){
                    this.markTextNode(node, 0, node.length, color);
                } else {
                    for(i = 0; i < node.childNodes.length; i++){
                        this.markNode(node.childNodes[i],  color);
                    }
                }
            }
        },

        markTextNode: function(node, startIndex, endIndex, color){
            var parentNode = node.parentNode,
                markNode,
                startTextNode,
                markedTextNode,
                endTextNode;

            if(node && node.nodeType === 3 && color !== ''){
                //split out text
                startTextNode = startIndex > 0
                    ? document.createTextNode(node.textContent.substring(0, startIndex))
                    : null;
                markedTextNode = document.createTextNode(node.textContent.substring(startIndex, endIndex));
                endTextNode = endIndex < node.textContent.length
                    ? document.createTextNode(node.textContent.substring(endIndex))
                    : null;

                //create container
                markNode = document.createElement('mark');
                markNode.appendChild(markedTextNode);
                markNode.style['background-color'] = color;
                markNode.style.color = 'inherit';

                //append new markup
                if(startTextNode){
                    parentNode.insertBefore(startTextNode, node);
                }
                parentNode.insertBefore(markNode, node);
                if(endTextNode){
                    parentNode.insertBefore(endTextNode, node);
                }

                //remove old markup
                parentNode.removeChild(node);
            }
        },

        styleMark: function(markNode, color){
            if(markNode){
                if(color !== ''){
                    markNode.style['background-color'] = color;
                } else {
                    //remove mark
                    this.removeMark(markNode);
                }
            }
        },

        removeDescendantMarks: function(node){
            var marks,
                i;

            //first try to strip marks completely.
            RTEExt.rte.Utils.stripDescendantStyle(node, this.stripDef);

            //convert any remaining marks
            marks = node.querySelectorAll('mark');
            for(i = 0; i < marks.length; i++){
                this.removeMark(marks[i]);
            }
        },

        removeMark: function(markNode){
            var span,
                i;

            //remove styling
            markNode.style['background-color'] = '';
            if(markNode.style.color === 'inherit'){
                markNode.style.color = '';
            }

            //strip mark tag.
            if(RTEExt.rte.Utils.canUnwrap(markNode, /mark/i)){
                RTEExt.rte.Utils.unwrap(markNode);
            }else{
                //convert mark into span
                RTEExt.rte.Utils.convertTagName(markNode, 'span');
            }
        }
    });

    RTEExt.rte.commands.TextHighlight.COMMAND_NAME = COMMAND_NAME;
    RTEExt.rte.commands.TextHighlight.COMMAND_REF = COMMAND_REF;
    RTEExt.rte.commands.TextHighlight.TOOLTIP_KEYS = TOOLTIP_KEYS;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.TextHighlight
    );
})(window.CUI);
