RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
(function(){
    "use strict";

    RTEExt.rte.MarkupStyler = new Class({
        toString: 'MarkupStyler',

        containerTags: [
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

        stylingContainerTags: [
            'a',
            'mark'
        ],

        ignoredTags: [
            'ul',
            'ol',
            'table',
            'tbody',
            'thead',
            'tfoot',
            'tr'
        ],

        stylingTagName: null,

        construct: function (stylingTagName) {
            this.stylingTagName = stylingTagName;
        },

        style: function(selection, styles, root){
            var actingRoot,
                curStyle,
                stripDef,
                styledFragment,
                startNode = selection.startNode,
                startOffset = startNode.nodeType === 3 ? selection.startOffset : null,
                endNode = selection.endNode,
                endOffset = endNode.nodeType === 3 ? selection.endOffset : null,
                readPointer,
                writePointer,
                curStylingNode,
                tempNode,
                tempTree,
                trackTree = false,
                startUnstyledText,
                styledText,
                endUnstyledText,
                foundStartNode = false,
                foundEndNode = false,
                i;

            //determine strip definition TODO: change so method doesn't need regexp to strip tags.
            stripDef = {
                'strip': {
                    'tagName': new RegExp(this.stylingTagName, 'i'),
                    'styles': {}
                },
                'unwrap': {
                    'tagName': this.stylingTagName
                }
            };
            for(curStyle in styles){
                if(styles.hasOwnProperty(curStyle)){
                    stripDef.strip.styles[curStyle] = /.*/;
                }
            }

            if(startNode && endNode){
                //determine acting root of start/end nodes.  This needs to be closest non-wrapping ancestor.
                actingRoot = this._getActingRoot(selection, root);

                //create document fragment to hold new content
                styledFragment = document.createDocumentFragment();
                writePointer = styledFragment;
                readPointer = actingRoot.firstChild;

                //copy and style content to document fragment.
                while(readPointer){
                    if(!foundStartNode && !foundEndNode && readPointer === startNode) {
                        foundStartNode = true;
                        if(startNode === endNode){
                            foundEndNode = true;
                        }

                        //split text appropriately
                        startUnstyledText = null;
                        styledText = null;
                        endUnstyledText = null;
                        if(startNode === endNode && (startOffset || (endOffset && endOffset < readPointer.textContent.length))){
                            //start/end are the same, so we need to split the single node.
                            startUnstyledText = startOffset
                                ? document.createTextNode(readPointer.textContent.substring(0, startOffset))
                                : null;
                            styledText = document.createTextNode(readPointer.textContent.substring(
                                startOffset || 0, endOffset || readPointer.textContent.length
                            ));
                            endUnstyledText = endOffset && endOffset < readPointer.textContent.length
                                ? document.createTextNode(readPointer.textContent.substring(endOffset))
                                : null;
                        } else if(startOffset) {
                            //there is a start offset, so we need to split the start node.
                            startUnstyledText = document.createTextNode(
                                readPointer.textContent.substring(0, startOffset)
                            );
                            styledText = document.createTextNode(readPointer.textContent.substring(startOffset));
                        }

                        //if the beginning portion of our start node is unstyled, just append now
                        if(startUnstyledText){
                            writePointer.appendChild(startUnstyledText);
                        }

                        //we need to move our write pointer up to first container node or styling container node
                        //(keep track of tree).
                        tempTree = [];
                        while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                            && !this._isStylingContainerNode(writePointer)){
                            //clone and track tree
                            tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                            //reposition write pointer
                            writePointer = writePointer.parentNode;
                        }

                        //set or create styling node
                        if(tempTree.length && this._isStylingNode(tempTree[tempTree.length - 1])){
                            curStylingNode = tempTree.pop();
                        } else {
                            curStylingNode = document.createElement(this.stylingTagName);
                        }
                        this._styleNode(curStylingNode, styles);
                        writePointer.appendChild(curStylingNode);
                        writePointer = curStylingNode;

                        //now recreate hierarchy
                        for(i = tempTree.length - 1; i >=0; i--){
                            writePointer.appendChild(tempTree[i]);
                            writePointer = tempTree[i];
                        }

                        //append styled start node
                        if(styledText){
                            writePointer.appendChild(styledText);
                        } else {
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        }

                        //if we also encountered our end node, handle the end portion now.
                        if(foundEndNode){
                            //close open styling node by move our write pointer above the current styling node
                            //and setting current styling node to null (keep track of tree).
                            tempTree = [];
                            while(writePointer !== curStylingNode){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }
                            writePointer = writePointer.parentNode;
                            RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                            if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                RTEExt.rte.Utils.unwrap(curStylingNode);
                            }
                            curStylingNode = null;

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                writePointer.appendChild(tempTree[i]);
                                writePointer = tempTree[i];
                            }

                            if(endUnstyledText){
                                writePointer.appendChild(endUnstyledText);
                            }
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer !== endNode){
                        //if readPointer is a container tag or styling container tag
                        if(this._isContainerNode(readPointer) || this._isStylingContainerNode(readPointer)
                            || this._isIgnoredNode(readPointer)){
                            //close any open styling node by move our write pointer above the current styling node
                            //and setting current styling node to null (keep track of tree).
                            if(curStylingNode){
                                tempTree = [];
                                while(writePointer !== curStylingNode){
                                    //clone and track tree
                                    tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                                    //reposition write pointer
                                    writePointer = writePointer.parentNode;
                                }
                                writePointer = writePointer.parentNode;
                                RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                                if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                    RTEExt.rte.Utils.unwrap(curStylingNode);
                                }
                                curStylingNode = null;

                                //now recreate hierarchy
                                for(i = tempTree.length - 1; i >=0; i--){
                                    writePointer.appendChild(tempTree[i]);
                                    writePointer = tempTree[i];
                                }
                            }

                            //append cloned node
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        } else if(!curStylingNode){
                            //we need to move our write pointer up to first container node or styling container node
                            //(keep track of tree).
                            tempTree = [];
                            while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                                && !this._isStylingContainerNode(writePointer)){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }

                            //set or create styling node
                            if(tempTree.length && this._isStylingNode(tempTree[tempTree.length - 1])){
                                curStylingNode = tempTree.pop();
                            } else if(!tempTree.length && this._isStylingNode(readPointer)){
                                curStylingNode = RTEExt.rte.Utils.cloneNode(readPointer);
                            } else {
                                curStylingNode = document.createElement(this.stylingTagName);
                            }
                            this._styleNode(curStylingNode, styles);
                            writePointer.appendChild(curStylingNode);
                            writePointer = curStylingNode;

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                writePointer.appendChild(tempTree[i]);
                                writePointer = tempTree[i];
                            }

                            //append readPointer if it hasn't already been appended
                            if(tempTree.length || !this._isStylingNode(readPointer)){
                                writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                            }
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer === endNode){
                        foundEndNode = true;

                        //split end node appropriately
                        styledText = null;
                        endUnstyledText = null;
                        if(endOffset && endOffset < readPointer.textContent.length) {
                            styledText = document.createTextNode(readPointer.textContent.substring(
                                0, endOffset
                            ));
                            endUnstyledText = document.createTextNode(readPointer.textContent.substring(endOffset));
                        }

                        //open a new styling node if we don't have one
                        if(!curStylingNode){
                            //we need to move our write pointer up to first container node or styling container node
                            //(keep track of tree).
                            tempTree = [];
                            while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                                && !this._isStylingContainerNode(writePointer)){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }

                            //set or create styling node
                            if(tempTree.length && this._isStylingNode(tempTree[tempTree.length - 1])){
                                curStylingNode = tempTree.pop();
                            } else {
                                curStylingNode = document.createElement(this.stylingTagName);
                            }
                            this._styleNode(curStylingNode, styles);
                            writePointer.appendChild(curStylingNode);
                            writePointer = curStylingNode;

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                writePointer.appendChild(tempTree[i]);
                                writePointer = tempTree[i];
                            }
                        }

                        //append styled end node
                        if(styledText){
                            writePointer.appendChild(styledText);
                        } else {
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        }

                        //close open styling node by move our write pointer above the current styling node
                        //and setting current styling node to null (keep track of tree).
                        tempTree = [];
                        while(writePointer !== curStylingNode){
                            //clone and track tree
                            tempTree.push(RTEExt.rte.Utils.cloneNode(writePointer));

                            //reposition write pointer
                            writePointer = writePointer.parentNode;
                        }
                        writePointer = writePointer.parentNode;
                        RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                        if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                            RTEExt.rte.Utils.unwrap(curStylingNode);
                        }
                        curStylingNode = null;

                        //now recreate hierarchy
                        for(i = tempTree.length - 1; i >=0; i--){
                            writePointer.appendChild(tempTree[i]);
                            writePointer = tempTree[i];
                        }

                        if(endUnstyledText){
                            writePointer.appendChild(endUnstyledText);
                        }
                    } else {
                        //we are before start node or after end node, just append our clone.
                        writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                    }

                    //move to next node.
                    if(readPointer.firstChild){
                        //when moving down a tree, readPointer moves down
                        //and writePointer moves to last child (if one exists).
                        readPointer = readPointer.firstChild;
                        writePointer = writePointer.lastChild ? writePointer.lastChild : writePointer;
                    } else if(readPointer.nextSibling){
                        //when moving across a tree, readPointer moves across and writePointer stays the same.
                        readPointer = readPointer.nextSibling;
                    } else {
                        //when moving up a tree, readPointer moves to first parents next sibling and
                        //writePointer follows the same pattern
                        while(!readPointer.nextSibling && readPointer !== actingRoot){
                            readPointer = readPointer.parentNode;
                            writePointer = writePointer.parentNode ? writePointer.parentNode : writePointer;
//                            if(writePointer === curStylingNode){
//                                //close any open styling node by move our write pointer above the current styling node
//                                //and setting current styling node to null.
//                                while(writePointer !== curStylingNode){
//                                    writePointer = writePointer.parentNode;
//                                }
//                                writePointer = writePointer.parentNode;
//                                RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
//                                if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
//                                    RTEExt.rte.Utils.unwrap(curStylingNode);
//                                }
//                                curStylingNode = null;
//
//                                //if my read pointer is moving out of a non wrapping node,
//                                //we need to move the write pointer an additional step up because an
//                                //additional styling node was created so our write pointer is an additional
//                                //step down.
//                                if(this._isContainerNode(readPointer) && writePointer.parentNode){
//                                    writePointer = writePointer.parentNode;
//                                }
//                            } else if(writePointer.parentNode){
//                                //move writePointer up
//                                writePointer = writePointer.parentNode;
//                            }
                        }

                        //set readPointer to correct location
                        if(readPointer === actingRoot){
                            //if we are at root, stop processing
                            readPointer = null;
                        } else {
                            //if we are not at root, we found a nextSibling, so point to it.
                            readPointer = readPointer.nextSibling;
                        }
                    }
                }

                //normalize nodes
                this._normalize(styledFragment);

                //remove all children of acting root
                while(actingRoot.firstChild){
                    actingRoot.removeChild(actingRoot.firstChild);
                }

                //append document fragment to acting root
                actingRoot.appendChild(styledFragment);
            }
        },

        _getActingRoot: function(selection, root){
            var startNodeAncestors = RTEExt.rte.Utils.getAncestors(selection.startNode, root),
                endNodeAncestors = RTEExt.rte.Utils.getAncestors(selection.endNode, root),
                activeRoot = null,
                startIndex = 0,
                endIndex = 0;

            while(activeRoot === null && startIndex < startNodeAncestors.length){
                if(startNodeAncestors[startIndex].tagName
                    && (this._isContainerNode(startNodeAncestors[startIndex])
                        || this._isStylingContainerNode(startNodeAncestors[startIndex]))
                    && startNodeAncestors[startIndex] === endNodeAncestors[endIndex]){
                    activeRoot = startNodeAncestors[startIndex];
                }

                //move to next set of checks
                if(endIndex < endNodeAncestors.length - 1){
                    endIndex++;
                } else {
                    startIndex++;
                    endIndex = 0;
                }
            }

            return activeRoot;
        },

        _isContainerNode: function(node){
            return node.tagName && this.containerTags.includes(node.tagName.toLowerCase());
        },

        _isStylingContainerNode: function(node){
            return node.tagName && this.stylingContainerTags.includes(node.tagName.toLowerCase());
        },

        _isIgnoredNode: function(node){
            return node.tagName && this.ignoredTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Applies provided styles to the node.
         */
        _styleNode: function(node, styles){
            var curStyle;

            if(node && node.style){
                for(curStyle in styles){
                    if(styles.hasOwnProperty(curStyle)){
                        node.style[curStyle] = styles[curStyle];
                    }
                }
            }
        },

        /**
         * Checks if provided node is a styling node.
         */
        _isStylingNode: function(node){
            //a styling node shares the same styling tag name
            var stylingNode = node.tagName && node.tagName.toLowerCase() === this.stylingTagName,
                i;

            //and doesn't contain an _rte attribute
            for(i = 0; stylingNode && i < node.attributes.length; i++){
                stylingNode = !node.attributes[i].name.startsWith('_rte');
            }

            return stylingNode;
        },

        /**
         * Determines if two nodes are the same.
         */
        _isEqual: function(node1, node2){
            var equal = false,
                node2Attributes = {},
                node2ClassNames = {},
                i;

            //only compare elements.
            if(node1.nodeType === 1 && node2.nodeType === 1){
                //compare tag name
                equal = node1.tagName === node2.tagName;

                //compare attribute length
                equal = equal && node1.attributes.length === node2.attributes.length;

                //compare style length
                equal = equal && node1.style.length === node2.style.length;

                //compare class length
                equal = equal && node1.classList.length === node2.classList.length;

                //compare specific attributes
                if(equal){
                    for(i = 0; i < node2.attributes.length; i++){
                        node2Attributes[node2.attributes[i].name] = node2.attributes[i].value;
                    }
                    for(i = 0; i < node1.attributes.length && equal; i++){
                        equal = node2Attributes.hasOwnProperty(node1.attributes[i].name)
                            && node1.attributes[i].value === node2Attributes[node1.attributes[i].name];
                    }
                }

                //compare specific styles
                for(i = 0; i < node1.style.length && equal; i++){
                    equal = node1.style[node1.style[i]] === node2.style[node1.style[i]];
                }

                //compare specific classes
                if(equal){
                    for(i = 0; i < node2.classList.length; i++){
                        node2ClassNames[node2.classList[i]] = true;
                    }
                    for(i = 0; i < node1.classList.length && equal; i++){
                        equal = node2ClassNames.hasOwnProperty(node1.classList[i]);
                    }
                }
            }

            return equal;
        },

        /**
         * Normalizes tree structure by combining sibling nodes that share the same applicable styles.
         */
        _normalize: function(node){
            var curNode = node.firstChild,
                nextNode,
                removableNode;

            //normalize non container nodes.
            while(curNode){
                //merge next sibling until we can't
                while(curNode.nextSibling
                    && !this._isContainerNode(curNode)
                    && !this._isContainerNode(curNode.nextSibling)
                    && !this._isStylingContainerNode(curNode)
                    && !this._isStylingContainerNode(curNode.nextSibling)
                    && !this._isIgnoredNode(curNode)
                    && !this._isIgnoredNode(curNode.nextSibling)
                    && this._isEqual(curNode, curNode.nextSibling)){
                    //merge siblings.
                    while(curNode.nextSibling.firstChild){
                        curNode.appendChild(curNode.nextSibling.firstChild);
                    }
                    curNode.parentNode.removeChild(curNode.nextSibling);
                }

                //track if we can remove the current node.
                if(curNode.nodeType === 1
                    && !this._isContainerNode(curNode)
                    && !this._isStylingContainerNode(curNode)
                    && !this._isIgnoredNode(curNode)
                    && !curNode.firstChild){
                    removableNode = curNode;
                } else {
                    removableNode = null;
                }

                //move to next node, try to move down or across first
                nextNode = curNode.firstChild || curNode.nextSibling;
                //no next node, find first sibling of parent structure.  don't go beyond root node
                while(!nextNode && curNode !== node && curNode.parentNode !== node){
                    curNode = curNode.parentNode;
                    nextNode = curNode.nextSibling;
                }
                curNode = nextNode;

                //remove empty nodes
                if(removableNode){
                    removableNode.parentNode.removeChild(removableNode);
                }
            }

            //finally normalize text nodes
            node.normalize();
        }
    });
})();
