RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.Utils = (function(CUI){
    "use strict";

    var containerTags = [
            'p',
            'div',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'blockquote',
            'pre',
            'li',
            'caption',
            'address',
            'th',
            'td'
        ],

        stylingContainerTags = [
            'a',
            'mark',
            'code'
        ],

        ignoredTags = [
            'ul',
            'ol',
            'table',
            'tbody',
            'thead',
            'tfoot',
            'tr'
        ],

        contentTags = [
            'br',
            'embed',
            'hr',
            'img',
            'input',
            'wbr'
        ];

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
    function isTag(node, tagName){
        return node.tagName && node.tagName.toLowerCase() === tagName;
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
    function canUnwrap(node, tagName){
        return isTag(node, tagName) && (hasNoAttributes(node) || hasOnlyEmptyStyleAttribute(node));
    }

    /**
     * Gets all ancestor nodes from the provided node to the provided root.
     */
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

    /**
     * Gets the common ancestor shared between 2 nodes up to the provided root node.  If a validAncestor function is
     * provided, it will be used to consider which ancestors may be compared otherwise all ancestors will be compared.
     */
    function getCommonAncestor(node1, node2, root, validAncestor){
        var node1Ancestors = getAncestors(node1, root),
            node2Ancestors = getAncestors(node2, root),
            commonAncestor = null,
            node1Index = 0,
            node2Index = 0;

        while(commonAncestor === null && node1Index < node1Ancestors.length){
            if((!validAncestor || validAncestor(node1Ancestors[node1Index]))
                && node1Ancestors[node1Index] === node2Ancestors[node2Index]){
                commonAncestor = node1Ancestors[node1Index];
            }

            //move to next set of checks
            if(node2Index < node2Ancestors.length - 1){
                node2Index++;
            } else {
                node1Index++;
                node2Index = 0;
            }
        }

        return commonAncestor;
    }

    /**
     * Converts the provided node tag to the target tagName.  This is done by creating a new element with the target
     * tagName, copying all attributes and children from the original and replacing the original.
     */
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

    /**
     * Clones the provided node by creating a new node of the same type and copying attributes and/or text.
     */
    function cloneNode(node){
        var newNode = null,
            i;

        if(node.nodeType === 1){
            newNode = document.createElement(node.tagName);
            for(i = 0; i < node.attributes.length; i++){
                newNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
            }
        } else if(node.nodeType === 3){
            newNode = document.createTextNode(node.textContent);
        }

        return newNode;
    }

    /**
     * Splits a text node into 3 possible parts depending on the startOffset and endOffset provided.
     */
    function splitTextNode(textNode, startOffset, endOffset){
        var splitNodes = {
            beginning: null,
            middle: null,
            end: null
        },
        normalizedStartOffset,
        normalizedEndOffset;

        if(textNode && textNode.nodeType === 3){
            //verify startOffset
            if(startOffset > textNode.textContent.length){
                //max startOffset can be text length
                normalizedStartOffset = textNode.textContent.length;
            } else if(startOffset > 0){
                //startOffset is valid value from 1 up to text length
                normalizedStartOffset = startOffset;
            } else {
                //startOffset is either invalid, non existent or 0. set to 0 so beginning split isn't performed.
                normalizedStartOffset = 0;
            }

            //verify endOffset
            if((endOffset < 0 || endOffset === 0 || endOffset > 0) && endOffset < normalizedStartOffset){
                //min endOffset is that of the normalizedStartOffset.  In this scenario, no middle text node will be
                //returned.
                normalizedEndOffset = normalizedStartOffset;
            } else if((endOffset === 0 || endOffset > 0) && endOffset <= textNode.textContent.length){
                //endOffset is valid value from normalizedStartOffset up to text length
                normalizedEndOffset = endOffset;
            } else {
                //endOffset is either invalid, non existent or greater than text length.
                //set to text length so end split isn't performed.
                normalizedEndOffset = textNode.textContent.length;
            }

            if(normalizedStartOffset > 0){
                //we need to do a beginning split up to start offset.
                splitNodes.beginning = document.createTextNode(
                    textNode.textContent.substring(0, normalizedStartOffset)
                );
            }
            if(normalizedEndOffset > normalizedStartOffset){
                //we need to do a middle split from start offset to end offset
                splitNodes.middle = document.createTextNode(
                    textNode.textContent.substring(normalizedStartOffset, normalizedEndOffset)
                );
            }
            if(normalizedEndOffset < textNode.textContent.length){
                //we need to  do an end split from end offset to remaining text
                splitNodes.end = document.createTextNode(
                    textNode.textContent.substring(normalizedEndOffset, textNode.textContent.length)
                );
            }
        }

        return splitNodes;
    }

    /**
     * Determines if two elements are similar.
     */
    function similarElements(element1, element2){
        var equal = false,
            element2Attributes = {},
            element2ClassNames = {},
            i;

        //only compare elements.
        if(element1.nodeType === 1 && element2.nodeType === 1){
            //compare tag name
            equal = element1.tagName === element2.tagName;

            //compare attribute length
            equal = equal && element1.attributes.length === element2.attributes.length;

            //compare style length
            equal = equal && element1.style.length === element2.style.length;

            //compare class length
            equal = equal && element1.classList.length === element2.classList.length;

            //compare specific attributes
            if(equal){
                for(i = 0; i < element2.attributes.length; i++){
                    element2Attributes[element2.attributes[i].name] = element2.attributes[i].value;
                }
                for(i = 0; i < element1.attributes.length && equal; i++){
                    equal = element2Attributes.hasOwnProperty(element1.attributes[i].name)
                        && element1.attributes[i].value === element2Attributes[element1.attributes[i].name];
                }
            }

            //compare specific styles
            for(i = 0; i < element1.style.length && equal; i++){
                equal = element1.style[element1.style[i]] === element2.style[element1.style[i]];
            }

            //compare specific classes
            if(equal){
                for(i = 0; i < element2.classList.length; i++){
                    element2ClassNames[element2.classList[i]] = true;
                }
                for(i = 0; i < element1.classList.length && equal; i++){
                    equal = element2ClassNames.hasOwnProperty(element1.classList[i]);
                }
            }
        }

        return equal;
    }

    /**
     * Normalizes tree structure by combining similar siblings.
     *
     * If a mergeable function is provided it will be used to determine if two elements may be merged.  If not provided,
     * sibling elements will not be merged.
     */
    function normalize(node, mergeable){
        var curNode = node.firstChild,
            nextNode,
            tempNode;

        //normalize non container nodes.
        while(curNode){
            //merge next sibling until we can't
            while(curNode.nextSibling
                && mergeable
                && mergeable(curNode)
                && mergeable(curNode.nextSibling)
                && similarElements(curNode, curNode.nextSibling)){
                //merge siblings.
                while(curNode.nextSibling.firstChild){
                    curNode.appendChild(curNode.nextSibling.firstChild);
                }
                curNode.parentNode.removeChild(curNode.nextSibling);
            }

            //move to next node, first try to move down and then across.  don't go beyond root node
            nextNode = curNode.firstChild;
            while(!nextNode && curNode !== node){
                //move across
                nextNode = curNode.nextSibling;

                //set current node to parent.
                curNode = curNode.parentNode;
            }
            curNode = nextNode;
        }

        //finally normalize text nodes
        node.normalize();
    }

    /**
     * Determines if the provided node is a container node, meaning styling nodes must be placed within it.
     */
    function isContainerNode(node){
        return node.tagName && containerTags.includes(node.tagName.toLowerCase());
    }

    /**
     * Determines if the provided node is a styling container node, meaning it serves as a container node but
     * may also be wrapped within existing styling tags (e.g. an <a/> tag wrapped in an <i/> tag or <i><a/></i>.
     */
    function isStylingContainerNode(node, stylingTagName){
        return node.tagName
            && (!stylingTagName || node.tagName.toLowerCase() !== stylingTagName)
            && stylingContainerTags.includes(node.tagName.toLowerCase());
    }

    /**
     * Determines if the provided node is an ignored node, meaning no special processing is performed on it.
     */
    function isIgnoredNode(node){
        return node.tagName && ignoredTags.includes(node.tagName.toLowerCase());
    }

    /**
     * Determines if a node is considered content.
     */
    function isContentNode(node){
        var isContent = node.nodeType === 3;

        //check "content tags".
        isContent = isContent || (node.tagName
            && contentTags.includes(node.tagName.toLowerCase()));

        return isContent;
    }

    return {
        getComputedStyle: getComputedStyle,
        unwrap: unwrap,
        canUnwrap: canUnwrap,
        getAncestors: getAncestors,
        getCommonAncestor: getCommonAncestor,
        convertTagName: convertTagName,
        cloneNode: cloneNode,
        splitTextNode: splitTextNode,
        normalize: normalize,
        isContainerNode: isContainerNode,
        isStylingContainerNode: isStylingContainerNode,
        isIgnoredNode: isIgnoredNode,
        isContentNode: isContentNode
    };
})(window.CUI);
