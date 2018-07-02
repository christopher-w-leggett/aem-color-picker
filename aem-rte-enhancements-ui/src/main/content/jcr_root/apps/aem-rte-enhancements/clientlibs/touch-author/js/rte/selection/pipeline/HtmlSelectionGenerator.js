RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.HtmlSelectionGenerator = new Class({
        toString: 'HtmlSelectionGenerator',

        extend: RTEExt.rte.selection.pipeline.Generator,

        _root: null,

        _startNode: null,

        _startOffset: null,

        _endNode: null,

        _endOffset: null,

        construct: function(startNode, startOffset, endNode, endOffset, root){
            if(root){
                //create internal document fragment to hold copied hierarchy
                this._root = document.createDocumentFragment();

                //set initial pointers
                let readPointer = root.firstChild;
                let writePointer = this._root;

                //copy hierarchy
                while(readPointer){
                    //clone node and append clone to our copied hierarchy
                    const clonedNode = RTEExt.rte.Utils.cloneNode(readPointer);
                    writePointer.appendChild(clonedNode);

                    //set start/end nodes if applicable
                    if(startNode === readPointer){
                        this._startNode = clonedNode;
                        this._startOffset = this._startNode.nodeType === 3 ? startOffset : null;
                    }
                    if(endNode === readPointer){
                        this._endNode = clonedNode;
                        this._endOffset = this._endNode.nodeType === 3 ? endOffset : null;
                    }

                    //move to next node.
                    if(readPointer.firstChild){
                        //when moving down a tree, readPointer moves down
                        //and writePointer moves to last child.
                        readPointer = readPointer.firstChild;
                        writePointer = writePointer.lastChild;
                    } else if(readPointer.nextSibling){
                        //when moving across a tree, readPointer moves across and writePointer stays the same.
                        readPointer = readPointer.nextSibling;
                    } else {
                        //when moving up a tree, readPointer moves to first parents next sibling and
                        //writePointer follows the same pattern
                        while(!readPointer.nextSibling && readPointer !== root){
                            //move readPointer and writePointer to parent
                            readPointer = readPointer.parentNode;
                            writePointer = writePointer.parentNode ? writePointer.parentNode : writePointer;
                        }

                        //set readPointer to correct location
                        if(readPointer === root){
                            //if we are at root, stop processing
                            readPointer = null;
                        } else {
                            //if we are not at root, we found a nextSibling, so point to it.
                            readPointer = readPointer.nextSibling;
                        }
                    }
                }
            }
        },

        generate: function(chain){
            if(this._startNode && this._endNode){
                const handler = chain.next();

                //indicate start selection
                handler.startSelection(chain);

                //set initial values
                const readTree = [];
                let readPointer = this._root.firstChild,
                    foundStartNode = false,
                    foundEndNode = false;

                //iterate across hierarchy
                while(readPointer){
                    const clonedNode = RTEExt.rte.Utils.cloneNode(readPointer);

                    //add to read tree
                    readTree.push(clonedNode);

                    if(!foundStartNode && !foundEndNode && readPointer === this._startNode) {
                        foundStartNode = true;
                        if(readPointer === this._endNode){
                            foundEndNode = true;
                        }

                        //start node may split so we will handle all events here.  replace with null so events aren't
                        //sent later
                        readTree.pop();
                        readTree.push(null);

                        //split node appropriately
                        let splitTextNodes = null;
                        if(readPointer.nodeType === 3){
                            if(foundEndNode){
                                //start/end are the same, so we need to split three ways.
                                splitTextNodes = RTEExt.rte.Utils.splitTextNode(
                                    readPointer, this._startOffset, this._endOffset
                                );
                            } else {
                                splitTextNodes = RTEExt.rte.Utils.splitTextNode(readPointer, this._startOffset, null);
                            }
                        }

                        //if we have a beginning portion of our start node, send outer node events
                        if(splitTextNodes && splitTextNodes.beginning){
                            handler.beginOuterNode(splitTextNodes.beginning, chain);
                            handler.endOuterNode(splitTextNodes.beginning, chain);
                        }

                        //send inner node events
                        if(splitTextNodes){
                            if(splitTextNodes.middle){
                                handler.beginInnerNode(splitTextNodes.middle, chain);
                                handler.endInnerNode(splitTextNodes.middle, chain);
                            }
                        } else {
                            handler.beginInnerNode(clonedNode, chain);
                            handler.endInnerNode(clonedNode, chain);
                        }

                        //we also encountered our end node and it was split, so send appropriate events
                        if(splitTextNodes && splitTextNodes.end){
                            handler.beginOuterNode(splitTextNodes.end, chain);
                            handler.endOuterNode(splitTextNodes.end, chain);
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer !== this._endNode){
                        //send inner node
                        handler.beginInnerNode(clonedNode, chain);
                    } else if(foundStartNode && !foundEndNode && readPointer === this._endNode){
                        foundEndNode = true;

                        //end node may split so we will handle all events here.  replace with null so events aren't
                        //sent later
                        readTree.pop();
                        readTree.push(null);

                        //split end node appropriately
                        let splitTextNodes = null;
                        if(readPointer.nodeType === 3){
                            splitTextNodes = RTEExt.rte.Utils.splitTextNode(readPointer, null, this._endOffset);
                        }

                        //send inner node events
                        if(splitTextNodes){
                            if(splitTextNodes.middle){
                                handler.beginInnerNode(splitTextNodes.middle, chain);
                                handler.endInnerNode(splitTextNodes.middle, chain);
                            }
                        } else {
                            handler.beginInnerNode(clonedNode, chain);
                            handler.endInnerNode(clonedNode, chain);
                        }

                        //so outer node events
                        if(splitTextNodes && splitTextNodes.end){
                            handler.beginOuterNode(splitTextNodes.end, chain);
                            handler.endOuterNode(splitTextNodes.end, chain);
                        }
                    } else {
                        //send outer node
                        handler.beginOuterNode(clonedNode, chain);
                    }

                    //move to next node.
                    if(readPointer.firstChild){
                        //we have children, so move down.
                        readPointer = readPointer.firstChild;
                    } else if(readPointer.nextSibling){
                        //we are leaving node, send appropriate event to handler
                        const tempNode = readTree.pop();
                        if(tempNode){
                            if(foundStartNode && !foundEndNode){
                                handler.endInnerNode(tempNode, chain);
                            } else {
                                handler.endOuterNode(tempNode, chain);
                            }
                        }

                        //move to next sibling
                        readPointer = readPointer.nextSibling;
                    } else {
                        //when moving up a tree, readPointer moves to first parents next sibling.
                        while(!readPointer.nextSibling && readPointer !== this._root){
                            //send appropriate event to handler
                            const tempNode = readTree.pop();
                            if(tempNode){
                                if(foundStartNode && !foundEndNode){
                                    handler.endInnerNode(tempNode, chain);
                                } else {
                                    handler.endOuterNode(tempNode, chain);
                                }
                            }

                            //move readPointer to parent
                            readPointer = readPointer.parentNode;
                        }

                        //set readPointer to correct location
                        if(readPointer === this._root){
                            //if we are at root, stop processing
                            readPointer = null;
                        } else {
                            //send appropriate event to handler
                            const tempNode = readTree.pop();
                            if(tempNode){
                                if(foundStartNode && !foundEndNode){
                                    handler.endInnerNode(tempNode, chain);
                                } else {
                                    handler.endOuterNode(tempNode, chain);
                                }
                            }

                            //move to parents sibling
                            readPointer = readPointer.nextSibling;
                        }
                    }
                }

                //indicate end selection
                handler.endSelection(chain);
            }
        }
    });
})();
