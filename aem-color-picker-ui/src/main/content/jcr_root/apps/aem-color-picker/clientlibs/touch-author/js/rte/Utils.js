ColorPicker = window.ColorPicker || {};
ColorPicker.rte = ColorPicker.rte || {};
ColorPicker.rte.Utils = (function(){
    "use strict";

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
    function getSelectionColor(selectionDef, rootNode){
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
     * Gets the computed color of the current selection.
     * If the selection isn't a range, it will find the computed color of the start node.
     * If the selection is a range, it will find the computed color of the start node and end node.  If the
     * start and end colors match, that color will be returned.
     */
    function getComputedColor(selectionDef){
        var color = '',
            startNode = selectionDef.startNode,
            endNode = selectionDef.endNode,
            startColor,
            endColor;

        //get element from start/end nodes
        while(startNode && startNode.nodeType === 3){
            startNode = startNode.parentNode;
        }
        while(endNode && endNode.nodeType === 3){
            endNode = endNode.parentNode;
        }

        //get computed colors
        startColor = startNode ? window.getComputedStyle(startNode, null).getPropertyValue('color') : '';
        endColor = endNode ? window.getComputedStyle(endNode, null).getPropertyValue('color') : '';

        //return proper computed color
        return !endNode || startColor === endColor ? startColor : '';
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
                stripDescendantColors(curChild);
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

    function getAncestors(node, rootNode){
        var ancestors = [],
            curNode;

        if(node && node !== rootNode){
            curNode = node.parentNode;
            while(curNode !== rootNode){
                ancestors.push(curNode);
                curNode = curNode.parentNode;
            }

            ancestors.push(rootNode);
        }

        return ancestors;
    }

    function getCommonAncestor(selectionDef, rootNode){
        var startNodeAncestors = getAncestors(selectionDef.startNode, rootNode),
            endNodeAncestors = getAncestors(selectionDef.endNode, rootNode),
            commonAncestor = null,
            startIndex = 0,
            endIndex = 0;

        if(!selectionDef.endNode && startNodeAncestors.length){
            commonAncestor = startNodeAncestors[0];
        } else {
            while(commonAncestor === null && startIndex < startNodeAncestors.length){
                if(startNodeAncestors[startIndex] === endNodeAncestors[endIndex]){
                    commonAncestor = startNodeAncestors[startIndex];
                }

                //move to next set of checks
                if(endIndex < endNodeAncestors.length - 1){
                    endIndex++;
                } else {
                    startIndex++;
                    endIndex = 0;
                }
            }
        }

        return commonAncestor;
    }

    return {
        getLeftDominantParents: getLeftDominantParents,
        getRightDominantParents: getRightDominantParents,
        isRangeSelection: isRangeSelection,
        isFullSelection: isFullSelection,
        getSelectionColor: getSelectionColor,
        getComputedColor: getComputedColor,
        getClosestColoredNode: getClosestColoredNode,
        getSharedDominantParent: getSharedDominantParent,
        stripDescendantColors: stripDescendantColors,
        getNextRangeSibling: getNextRangeSibling,
        getCommonAncestor: getCommonAncestor,
        canUnwrap: canUnwrap,
        unwrap: unwrap
    };
})();
