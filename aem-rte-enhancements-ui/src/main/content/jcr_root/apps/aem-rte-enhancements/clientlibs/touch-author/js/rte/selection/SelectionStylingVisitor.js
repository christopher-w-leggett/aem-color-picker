RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
(function(){
    "use strict";

    RTEExt.rte.SelectionStylingVisitor = new Class({
        toString: 'SelectionStylingVisitor',

        _stylingWriter: null,

        _startNodeDef: null,

        construct: function (stylingWriter) {
            this._stylingWriter = stylingWriter;
        },

        visitingStartNode: function(node, startOffset){
            //we don't actually know if our start and end node are the same yet, so track start details and delay
            //writing
            this._startNodeDef = {
                node: node,
                startOffset: startOffset,
                endOffset: null
            };
        },

        visitingInnerNode: function(node){
            //write delayed start node if we found it
            if(this._startNodeDef){
                this._writeStartNode();
            }

            //write node
            this._stylingWriter.write(node);
        },

        visitingEndNode: function(node, endOffset){
            var splitTextNodes = null;

            //split end node appropriately
            if(node.nodeType === 3){
                splitTextNodes = RTEExt.rte.Utils.splitTextNode(node, null, endOffset);
            }

            //write delayed start node if we found it
            if(this._startNodeDef){
                //set end offset if applicable to indicate we are writing start and end nodes.
                if(this._startNodeDef.node === node){
                    this._startNodeDef.endOffset = endOffset;
                }

                //write start node
                this._writeStartNode();

                //close styling node
                this._stylingWriter.closeStylingNode();

                //write end text
                if(splitTextNodes && splitTextNodes.end){
                    this._stylingWriter.write(splitTextNodes.end);
                }
            } else {
                //append styled end node
                if(splitTextNodes){
                    if(splitTextNodes.middle){
                        this._stylingWriter.write(splitTextNodes.middle);
                    }
                } else {
                    this._stylingWriter.write(node);
                }

                //close styling node
                this._stylingWriter.closeStylingNode();

                //write end text
                if(splitTextNodes && splitTextNodes.end){
                    this._stylingWriter.write(splitTextNodes.end);
                }
            }
        },

        visitingOuterNode: function(node){
            this._stylingWriter.write(node);
        },

        movedDown: function(){
            //move styling writer down.
            this._stylingWriter.moveDown();
        },

        movedAcross: function(){
            //do nothing
        },

        movedUp: function(){
            //move styling writer up TODO: might need to move it up multiple times, but ideally is contained in the writer.
            this._stylingWriter.moveUp();
        },

        _writeStartNode: function(){
            var splitTextNodes = null,
                tempTree,
                i;

            //split node appropriately
            if(this._startNodeDef.node.nodeType === 3){
                splitTextNodes = RTEExt.rte.Utils.splitTextNode(
                    this._startNodeDef.node, this._startNodeDef.startOffset, this._startNodeDef.endOffset
                );
            }

            //if the beginning portion of our start node is unstyled, just append now
            if(splitTextNodes && splitTextNodes.beginning){
                this._stylingWriter.write(splitTextNodes.beginning);
            }

            //open new styling node
            this._stylingWriter.openStylingNode();

            //append styled start node
            if(splitTextNodes){
                if(splitTextNodes.middle){
                    this._stylingWriter.write(splitTextNodes.middle);
                }
            } else {
                this._stylingWriter.write(this._startNodeDef.node);
            }

            //clear start node def.
            this._startNodeDef = null;
        }
    });
})();
