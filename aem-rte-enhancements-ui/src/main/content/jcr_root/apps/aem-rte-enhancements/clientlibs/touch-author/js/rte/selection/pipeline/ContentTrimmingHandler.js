RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.ContentTrimmingHandler = new Class({
        toString: 'ContentTrimmingHandler',

        extend: RTEExt.rte.selection.pipeline.Handler,

        _beginningContent: null,

        _endContent: null,

        _processedTree: null,

        _processingQueue: null,

        _processedSelectionStart: null,

        _processedSelectionEnd: null,

        construct: function(beginningContent, endContent){
            this._beginningContent = beginningContent;
            this._endContent = endContent;
            this._processedTree = [];
            this._processingQueue = [];
            this._processedSelectionStart = false;
            this._processedSelectionEnd = false;
        },

        startSelection: function(chain){
            //move to next handler
            chain.next().startSelection(chain);
        },

        beginInnerNode: function(node, chain){
            let processedNode = node;

            //if we haven't yet processed selection start, then this is it.  Strip off beginning content if necessary.
            if(!this._processedSelectionStart){
                processedNode = this._processStartNode(node);

                //start was processed
                this._processedSelectionStart = true;
            }

            //track processed node
            this._processedTree.push(processedNode);

            //queue up next handler processing in case this is the end node.
            this._addToQueue(processedNode, chain.next().beginInnerNode.bind(chain.next(), processedNode, chain));
        },

        endInnerNode: function(node, chain){
            //queue up next handler processing in case this is the end node, send last node from processed tree
            const processedNode = this._processedTree.pop();
            this._addToQueue(processedNode, chain.next().endInnerNode.bind(chain.next(), processedNode, chain));
        },

        beginOuterNode: function(node, chain){
            //if we processed selection start and have not yet processed selection end, then this is it.
            //strip off end content if necessary.
            if(this._processedSelectionStart && !this._processedSelectionEnd){
                //process end node
                this._processEndNode(chain);

                //flush queue
                this._flushQueue();

                //end was processed
                this._processedSelectionEnd = true;
            }

            //track processed node
            this._processedTree.push(node);

            //move to next handler
            chain.next().beginOuterNode(node, chain);
        },

        endOuterNode: function(node, chain){
            //if we processed selection start and have not yet processed selection end, then this is it.
            //strip off end content if necessary.
            if(this._processedSelectionStart && !this._processedSelectionEnd){
                //process end node
                this._processEndNode(chain);

                //flush queue
                this._flushQueue();

                //end was processed
                this._processedSelectionEnd = true;
            }

            //move to next handler, send last node from processed tree
            chain.next().endOuterNode(this._processedTree.pop(), chain);
        },

        endSelection: function(chain){
            //if we processed selection start and have not yet processed selection end, then end was last node.
            //strip off end content if necessary.
            if(this._processedSelectionStart && !this._processedSelectionEnd){
                //process end node
                this._processEndNode(chain);

                //flush queue
                this._flushQueue();

                //end was processed
                this._processedSelectionEnd = true;
            }

            //move to next handler
            chain.next().endSelection(chain);
        },

        _processStartNode: function(node){
            let processedNode = node;

            if(node.nodeType === 3 && this._beginningContent && node.textContent.startsWith(this._beginningContent)){
                processedNode = document.createTextNode(node.textContent.substring(this._beginningContent.length));
            }

            return processedNode;
        },

        _processEndNode: function(chain){
            if(this._processingQueue.length
                && this._processingQueue[this._processingQueue.length - 1].node.nodeType === 3
                && this._endContent
                && this._processingQueue[this._processingQueue.length - 1].node.textContent.endsWith(this._endContent)){
                //text nodes have start and end entries right next to each other, so we can just pop them off.
                let processedNode = this._processingQueue.pop().node;
                this._processingQueue.pop();

                //strip content
                processedNode = document.createTextNode(
                    processedNode.textContent.substring(
                        0, processedNode.textContent.length - this._endContent.length
                    )
                );

                //add new queue entries
                this._addToQueue(
                    processedNode, chain.next().beginInnerNode.bind(chain.next(), processedNode, chain)
                );
                this._addToQueue(
                    processedNode, chain.next().endInnerNode.bind(chain.next(), processedNode, chain)
                );
            }
        },

        /**
         * Adds entry to processing queue for later processing.
         */
        _addToQueue: function(node, callback){
            this._processingQueue.push({
                node: node,
                callback: callback
            });
        },

        /**
         * flushes processing queue.
         */
        _flushQueue: function(){
            while(this._processingQueue.length){
                this._processingQueue.shift().callback();
            }
        }
    });
})();
