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
                startOffset = startNode && startNode.nodeType === 3 ? selection.startOffset : null,
                endNode = selection.endNode,
                endOffset = endNode && endNode.nodeType === 3 ? selection.endOffset : null,
                readPointer,
                writePointer,
                curStylingNode,
                tempNode,
                tempTree,
                splitTextNodes,
                foundStartNode = false,
                foundEndNode = false,
                i;

            //determine strip definition
            stripDef = {
                'strip': {
                    'tagName': this.stylingTagName,
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
                actingRoot = RTEExt.rte.Utils.getCommonAncestor(startNode, endNode, root, function(node){
                    return node.tagName && (this._isContainerNode(node) || this._isStylingContainerNode(node));
                }.bind(this));

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

                        //split node appropriately
                        if(startNode.nodeType === 3){
                            if(startNode === endNode){
                                //start/end are the same, so we need to split three ways.
                                splitTextNodes = RTEExt.rte.Utils.splitTextNode(startNode, startOffset, endOffset);
                            } else {
                                splitTextNodes = RTEExt.rte.Utils.splitTextNode(startNode, startOffset, null);
                            }
                        } else {
                            splitTextNodes = null;
                        }

                        //if the beginning portion of our start node is unstyled, just append now
                        if(splitTextNodes && splitTextNodes.beginning){
                            writePointer.appendChild(splitTextNodes.beginning);
                        }

                        //we need to move our write pointer up to first container node or styling container node
                        while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                            && !this._isStylingContainerNode(writePointer)){
                            //reposition write pointer
                            writePointer = writePointer.parentNode;
                        }

                        //determine any hierarchy that will need to be recreated.
                        tempTree = [];
                        tempNode = readPointer.parentNode;
                        while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                            && !this._isStylingContainerNode(tempNode)){
                            //clone and track tree
                            tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                            //reposition
                            tempNode = tempNode.parentNode;
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
                        if(splitTextNodes){
                            if(splitTextNodes.middle){
                                writePointer.appendChild(splitTextNodes.middle);
                            }
                        } else {
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        }

                        //if we also encountered our end node, handle the end portion now.
                        if(foundEndNode){
                            //close open styling node by move our write pointer above the current styling node
                            //and setting current styling node to null.
                            while(writePointer !== curStylingNode){
                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }
                            writePointer = writePointer.parentNode;
                            RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                            if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                RTEExt.rte.Utils.unwrap(curStylingNode);
                            }
                            curStylingNode = null;

                            //determine any hierarchy that will need to be recreated.
                            tempTree = [];
                            tempNode = readPointer.parentNode;
                            while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                                && !this._isStylingContainerNode(tempNode)){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                                //reposition
                                tempNode = tempNode.parentNode;
                            }

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                writePointer.appendChild(tempTree[i]);
                                writePointer = tempTree[i];
                            }

                            if(splitTextNodes && splitTextNodes.end){
                                writePointer.appendChild(splitTextNodes.end);
                            }
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer !== endNode){
                        //if readPointer is a container tag or styling container tag
                        if(this._isContainerNode(readPointer) || this._isStylingContainerNode(readPointer)
                            || this._isIgnoredNode(readPointer)){
                            //close any open styling node by move our write pointer above the current styling node
                            //and setting current styling node to null.
                            if(curStylingNode){
                                while(writePointer !== curStylingNode){
                                    //reposition write pointer
                                    writePointer = writePointer.parentNode;
                                }
                                writePointer = writePointer.parentNode;
                                RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                                if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                    RTEExt.rte.Utils.unwrap(curStylingNode);
                                }
                                curStylingNode = null;

                                if(this._isStylingContainerNode(readPointer)){
                                    //determine any hierarchy that will need to be recreated.
                                    tempTree = [];
                                    tempNode = readPointer.parentNode;
                                    while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                                        && !this._isStylingContainerNode(tempNode)){
                                        //clone and track tree
                                        tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                                        //reposition
                                        tempNode = tempNode.parentNode;
                                    }

                                    //now recreate hierarchy
                                    for(i = tempTree.length - 1; i >=0; i--){
                                        writePointer.appendChild(tempTree[i]);
                                        writePointer = tempTree[i];
                                    }
                                }
                            }

                            //append cloned node
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        } else if(!curStylingNode){
                            //we need to move our write pointer up to first container node or styling container node.
                            while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                                && !this._isStylingContainerNode(writePointer)){
                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }

                            //determine any hierarchy that will need to be recreated.
                            tempTree = [];
                            tempNode = readPointer.parentNode;
                            while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                                && !this._isStylingContainerNode(tempNode)){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                                //reposition
                                tempNode = tempNode.parentNode;
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
                        } else {
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer === endNode){
                        foundEndNode = true;

                        //split end node appropriately
                        if(endNode.nodeType === 3){
                            splitTextNodes = RTEExt.rte.Utils.splitTextNode(endNode, null, endOffset);
                        } else {
                            splitTextNodes = null;
                        }

                        //open a new styling node if we don't have one
                        if(!curStylingNode){
                            //we need to move our write pointer up to first container node or styling container node.
                            while(writePointer !== styledFragment && !this._isContainerNode(writePointer)
                                && !this._isStylingContainerNode(writePointer)){
                                //reposition write pointer
                                writePointer = writePointer.parentNode;
                            }

                            //determine any hierarchy that will need to be recreated.
                            tempTree = [];
                            tempNode = readPointer.parentNode;
                            while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                                && !this._isStylingContainerNode(tempNode)){
                                //clone and track tree
                                tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                                //reposition
                                tempNode = tempNode.parentNode;
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
                        if(splitTextNodes){
                            if(splitTextNodes.middle){
                                writePointer.appendChild(splitTextNodes.middle);
                            }
                        } else {
                            writePointer.appendChild(RTEExt.rte.Utils.cloneNode(readPointer));
                        }

                        //close open styling node by move our write pointer above the current styling node
                        //and setting current styling node to null.
                        while(writePointer !== curStylingNode){
                            //reposition write pointer
                            writePointer = writePointer.parentNode;
                        }
                        writePointer = writePointer.parentNode;
                        RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                        if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                            RTEExt.rte.Utils.unwrap(curStylingNode);
                        }
                        curStylingNode = null;

                        //determine any hierarchy that will need to be recreated.
                        tempTree = [];
                        tempNode = readPointer.parentNode;
                        while(tempNode !== actingRoot && !this._isContainerNode(tempNode)
                            && !this._isStylingContainerNode(tempNode)){
                            //clone and track tree
                            tempTree.push(RTEExt.rte.Utils.cloneNode(tempNode));

                            //reposition
                            tempNode = tempNode.parentNode;
                        }

                        //now recreate hierarchy
                        for(i = tempTree.length - 1; i >=0; i--){
                            writePointer.appendChild(tempTree[i]);
                            writePointer = tempTree[i];
                        }

                        if(splitTextNodes && splitTextNodes.end){
                            writePointer.appendChild(splitTextNodes.end);
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
                            if(writePointer === curStylingNode){
                                //close any open styling node by move our write pointer above the current styling node
                                //and setting current styling node to null.
                                while(writePointer !== curStylingNode){
                                    writePointer = writePointer.parentNode;
                                }
                                writePointer = writePointer.parentNode;
                                RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                                if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                    RTEExt.rte.Utils.unwrap(curStylingNode);
                                }
                                curStylingNode = null;

                                //if my read pointer is moving out of a container node,
                                //we need to move the write pointer an additional step up because an
                                //additional styling node was created so our write pointer is an additional
                                //step down.
                                if((this._isContainerNode(readPointer) || this._isStylingContainerNode(readPointer))
                                    && writePointer.parentNode){
                                    writePointer = writePointer.parentNode;
                                }
                            } else if(writePointer.parentNode){
                                //move writePointer up
                                writePointer = writePointer.parentNode;
                            }
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
                RTEExt.rte.Utils.normalize(
                    styledFragment,
                    function(node){
                        return !this._isContainerNode(node)
                            && !this._isStylingContainerNode(node)
                            && !this._isIgnoredNode(node);
                    }.bind(this),
                    function(node){
                        var strip = false;

                        if(node.nodeType === 1
                            && !this._isContainerNode(node)
                            && !this._isStylingContainerNode(node)
                            && !this._isIgnoredNode(node)
                            && !node.firstChild){
                            strip = true;
                        } else if(node.nodeType === 3 && node.textContent.length === 0) {
                            strip = true;
                        }

                        return strip;
                    }.bind(this)
                );

                //remove all children of acting root
                while(actingRoot.firstChild){
                    actingRoot.removeChild(actingRoot.firstChild);
                }

                //append document fragment to acting root
                actingRoot.appendChild(styledFragment);
            }
        },

        /**
         * Determines if the provided node is a container node, meaning styling nodes must be placed within it.
         */
        _isContainerNode: function(node){
            return node.tagName && this.containerTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Determines if the provided node is a styling container node, meaning it serves as a container node but
         * may also be wrapped within existing styling tags (e.g. an <a/> tag wrapped in an <i/> tag or <i><a/></i>.
         */
        _isStylingContainerNode: function(node){
            return node.tagName && node.tagName.toLowerCase() !== this.stylingTagName
                && this.stylingContainerTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Determines if the provided node is an ignored node, meaning no special processing is performed on it.
         */
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
         * Checks if provided node is a styling node.  A styling node shares the stylingTagName and isn't an AEM
         * placeholder node.
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
        }
    });
})();
