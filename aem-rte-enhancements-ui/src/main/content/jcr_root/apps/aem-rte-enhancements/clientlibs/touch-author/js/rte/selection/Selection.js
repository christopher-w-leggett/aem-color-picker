RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
(function(){
    "use strict";

    RTEExt.rte.Selection = new Class({
        toString: 'Selection',

        _root: null,

        _startNode: null,

        _startOffset: null,

        _endNode: null,

        _endOffset: null,

        construct: function(startNode, startOffset, endNode, endOffset, root){
            var readPointer,
                writePointer,
                clonedNode;

            //create internal document fragment to hold copied hierarchy
            this._root = document.createDocumentFragment();

            //set initial pointers
            readPointer = root.firstChild;
            writePointer = this._root;

            //copy hierarchy
            while(readPointer){
                //clone node and append clone to our copied hierarchy
                clonedNode = RTEExt.rte.Utils.cloneNode(readPointer);
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
        },

        accept: function(visitor){
            var readPointer,
                clonedNode,
                foundStartNode = false,
                foundEndNode = false;

            if(this._startNode && this._endNode){
                //set initial pointer
                readPointer = this._root.firstChild;

                //iterate across hierarchy
                while(readPointer){
                    if(!foundStartNode && !foundEndNode && readPointer === this._startNode) {
                        foundStartNode = true;
                        if(readPointer === this._endNode){
                            foundEndNode = true;
                        }

                        //send node to visitor
                        clonedNode = RTEExt.rte.Utils.cloneNode(readPointer);
                        visitor.visitingStartNode(clonedNode, this._startOffset);

                        //we also encountered our end node so send to visitor
                        if(foundEndNode){
                            visitor.visitingEndNode(clonedNode, this._endOffset);
                        }
                    } else if(foundStartNode && !foundEndNode && readPointer !== this._endNode){
                        //send inner node to visitor
                        visitor.visitingInnerNode(RTEExt.rte.Utils.cloneNode(readPointer));
                    } else if(foundStartNode && !foundEndNode && readPointer === this._endNode){
                        foundEndNode = true;

                        //send end node to visitor
                        visitor.visitingEndNode(RTEExt.rte.Utils.cloneNode(readPointer), this._endOffset);
                    } else {
                        //send outer node to visitor
                        visitor.visitingOuterNode(RTEExt.rte.Utils.cloneNode(readPointer));
                    }

                    //move to next node.
                    if(readPointer.firstChild){
                        //when moving down a tree, readPointer moves down.
                        readPointer = readPointer.firstChild;
                        visitor.movedDown();
                    } else if(readPointer.nextSibling){
                        //when moving across a tree, readPointer moves across.
                        readPointer = readPointer.nextSibling;
                        visitor.movedAcross();
                    } else {
                        //when moving up a tree, readPointer moves to first parents next sibling.
                        while(!readPointer.nextSibling && readPointer !== this._root){
                            //move readPointer to parent
                            readPointer = readPointer.parentNode;
                            visitor.movedUp();
                        }

                        //set readPointer to correct location
                        if(readPointer === this._root){
                            //if we are at root, stop processing
                            readPointer = null;
                        } else {
                            //if we are not at root, we found a nextSibling, so point to it.
                            readPointer = readPointer.nextSibling;
                            visitor.movedAcross();
                        }
                    }
                }
            }
        }
    });
})();
