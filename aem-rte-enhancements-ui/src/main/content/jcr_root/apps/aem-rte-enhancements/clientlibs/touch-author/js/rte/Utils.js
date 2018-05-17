RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.Utils = (function(CUI){
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
    function getSharedDominantParent(startNode, endNode, rootNode, sharedTagName){
        var leftDominantParents = getLeftDominantParents(startNode, rootNode),
            rightDominantParents = getRightDominantParents(endNode, rootNode),
            sharedTagName = sharedTagName || '*',
            sharedDominantParent = null,
            leftIndex = leftDominantParents.length - 1,
            rightIndex = rightDominantParents.length - 1;

        while(sharedDominantParent === null && leftIndex > -1){
            if(leftDominantParents[leftIndex] === rightDominantParents[rightIndex]
                && (sharedTagName === '*' || leftDominantParents[leftIndex].tagName.toLowerCase() === sharedTagName)){
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
     * Gets the parent that is shared between the startNode and endNode.  The parent chosen is the one closest to both
     * the start/end nodes and considers the startNode as the first child and the endNode as the last child
     * conceptually.
     */
    function getSharedParent(startNode, endNode, rootNode){
        var leftDominantParents = getLeftDominantParents(startNode, rootNode),
            rightDominantParents = getRightDominantParents(endNode, rootNode),
            sharedParent = null,
            leftIndex = 0,
            rightIndex = 0;

        while(sharedParent === null && leftIndex < leftDominantParents.length){
            if(leftDominantParents[leftIndex] === rightDominantParents[rightIndex]){
                sharedParent = leftDominantParents[leftIndex];
            }

            //move to next set of checks
            if(rightIndex < rightDominantParents.length - 1){
                rightIndex++;
            } else {
                leftIndex++;
                rightIndex = 0;
            }
        }

        return sharedParent;
    }

    /**
     * Gets the closest defined style starting from the provided node and working up the parent tree.
     */
    function getClosestStyle(node, criteria, rootNode){
        var style = '',
            curNode = node,
            searchTag = criteria.tagName || '*';

        while('' === style && curNode !== rootNode){
            style = curNode.style && (curNode.tagName.toLowerCase() === searchTag || searchTag === '*')
                ? curNode.style[criteria.style]
                : '';
            curNode = curNode.parentNode;
        }

        return style;
    }

    /**
     * Gets the closest node with a defined style starting from the provided node and working up the parent tree.
     */
    function getClosestStyledNode(node, criteria, rootNode){
        var styledNode = null,
            curNode = node,
            searchTag = criteria.tagName || '*';

        while(null === styledNode && curNode !== rootNode){
            styledNode = curNode.style && curNode.style[criteria.style] !== ''
                && (curNode.tagName.toLowerCase() === searchTag || searchTag === '*') ? curNode : null;
            curNode = curNode.parentNode;
        }

        return styledNode;
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
     * Gets the requested style of the current selection.
     * If the selection isn't a range, it will find the style of the closest styled parent node.
     * If the selection is a range, it will find the style of the closest parent at the start of the range and
     * at the end of the range.  If the start and end styles match, that style will be returned.
     */
    function getSelectionStyle(selectionDef, criteria, rootNode){
        var color = '',
            startColor,
            endColor;

        if(!isRangeSelection(selectionDef)){
            color = getClosestStyle(selectionDef.startNode, criteria, rootNode);
        } else {
            startColor = selectionDef.startNode ? getClosestStyle(selectionDef.startNode, criteria, rootNode) : '';
            endColor = selectionDef.endNode ? getClosestStyle(selectionDef.endNode, criteria, rootNode) : '';
            if(startColor === endColor){
                color = startColor;
            }
        }

        return color;
    }

    /**
     * Gets the computed style of the current selection.  If a tagName is provided in the criteria, the closest parent
     * with that tagName will be considered.
     * If the selection isn't a range, it will find the computed style of the start node.
     * If the selection is a range, it will find the computed style of the start node and end node.  If the
     * start and end styles match, that style will be returned.
     */
    function getComputedStyle(selectionDef, criteria, rootNode){
        var startNode = selectionDef.startNode,
            endNode = selectionDef.endNode,
            startStyle,
            endStyle;

        //if we were provided a specific tag name to look for, move our start/end nodes to that position
        if(criteria.tagName && criteria.tagName !== '*'){
            while(startNode && (!startNode.tagName || startNode.tagName.toLowerCase() !== criteria.tagName)){
                startNode = startNode.parentNode;
                if(startNode === rootNode){
                    startNode = null;
                }
            }
            while(endNode && (!endNode.tagName || endNode.tagName.toLowerCase() !== criteria.tagName)){
                endNode = endNode.parentNode;
                if(endNode === rootNode){
                    endNode = null;
                }
            }
        }

        //get element from start/end nodes
        while(startNode && startNode.nodeType === 3){
            startNode = startNode.parentNode;
        }
        while(endNode && endNode.nodeType === 3){
            endNode = endNode.parentNode;
        }

        //get computed styles
        startStyle = startNode ? window.getComputedStyle(startNode, null).getPropertyValue(criteria.style) : '';
        endStyle = endNode ? window.getComputedStyle(endNode, null).getPropertyValue(criteria.style) : '';

        //return proper computed style
        return !selectionDef.endNode || startStyle === endStyle ? startStyle : '';
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
        parentNode.normalize();
    }

    /**
     * Determines if provided node is a specific tag.
     */
    function isTag(node, tagNameRegex){
        return node.tagName && tagNameRegex.test(node.tagName);
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
    function canUnwrap(node, tagNameRegex){
        return isTag(node, tagNameRegex) && (hasNoAttributes(node) || hasOnlyEmptyStyleAttribute(node));
    }

    /**
     * Strips styles from descendant nodes.  Any tag matching the unwrap tagName without any styles will be unwrapped.
     *
     * criteria = {
     *     'strip': {
     *         'tagName': <regex>,
     *         'styles': {
     *             '<style-name>': <regex>,
     *             ...
     *         }
     *     },
     *     'unwrap': {
     *         'tagName': <regex>,
     *     }
     * }
     */
    function stripDescendantStyle(node, criteria){
        var curChild = node.firstChild,
            curStyle,
            markerNode;

        while(curChild){
            if(curChild.style && curChild.tagName && criteria.strip.tagName.test(curChild.tagName)){
                for(curStyle in criteria.strip.styles){
                    if(criteria.strip.styles.hasOwnProperty(curStyle)){
                        if(criteria.strip.styles[curStyle].test(curChild.style[curStyle])){
                            curChild.style[curStyle] = '';
                        }
                    }
                }
            }

            if(criteria.unwrap.tagName && canUnwrap(curChild, criteria.unwrap.tagName)){
                markerNode = curChild.previousSibling || node;
                unwrap(curChild);
                curChild = markerNode === node ? markerNode.firstChild : markerNode.nextSibling;
            }else{
                stripDescendantStyle(curChild, criteria);
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

    function findAncestorTag(node, tagName, rootNode){
        var ancestor = null,
            ancestors = RTEExt.rte.Utils.getAncestors(node, rootNode),
            i = ancestors.length - 1;

        while(ancestor === null && i >= 0){
            if(ancestors[i].tagName && ancestors[i].tagName.toLowerCase() === tagName){
                ancestor = ancestors[i];
            }

            i--;
        }

        return ancestor;
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

    function convertTagName(node, tagName){
        var newNode,
            i;

        if(node.tagName && tagName && node.tagName.toLowerCase() !== tagName){
            //convert tag
            newNode = document.createElement(tagName);
            for(i = 0; i < node.attributes.length; i++){
                newNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
            }
            while(node.firstChild){
                newNode.appendChild(node.firstChild);
            }
            node.parentNode.insertBefore(newNode, node);
            node.parentNode.removeChild(node);

            return newNode;
        }else{
            return node;
        }
    }

    return {
        getLeftDominantParents: getLeftDominantParents,
        getRightDominantParents: getRightDominantParents,
        isRangeSelection: isRangeSelection,
        isFullSelection: isFullSelection,
        getSelectionStyle: getSelectionStyle,
        getComputedStyle: getComputedStyle,
        getClosestStyledNode: getClosestStyledNode,
        getSharedDominantParent: getSharedDominantParent,
        getSharedParent: getSharedParent,
        stripDescendantStyle: stripDescendantStyle,
        getNextRangeSibling: getNextRangeSibling,
        getAncestors: getAncestors,
        findAncestorTag: findAncestorTag,
        getCommonAncestor: getCommonAncestor,
        canUnwrap: canUnwrap,
        unwrap: unwrap,
        convertTagName: convertTagName
    };
})(window.CUI);
