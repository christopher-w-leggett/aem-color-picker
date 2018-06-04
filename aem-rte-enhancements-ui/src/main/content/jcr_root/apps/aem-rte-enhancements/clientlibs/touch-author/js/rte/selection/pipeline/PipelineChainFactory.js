RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.PipelineChainFactory = new Class({
        toString: 'PipelineChainFactory',

        construct: function(){
        },

        create: function(handlers){
            var chainFactory = this,
                handlersCopy = handlers.slice(),
                nextHandler = handlersCopy.length ? handlersCopy.shift() : null,
                nextChain = handlers.length ? this.create(handlersCopy) : null;

            if(nextHandler){
                return new RTEExt.rte.selection.pipeline.PipelineChain({
                    startSelection: function(chain){
                        if(nextHandler){
                            nextHandler.startSelection(nextChain);
                        }
                    },
                    beginInnerNode: function(node, chain){
                        if(nextHandler){
                            nextHandler.beginInnerNode(node, nextChain);
                        }
                    },
                    endInnerNode: function(node, chain){
                        if(nextHandler){
                            nextHandler.endInnerNode(node, nextChain);
                        }
                    },
                    beginOuterNode: function(node, chain){
                        if(nextHandler){
                            nextHandler.beginOuterNode(node, nextChain);
                        }
                    },
                    endOuterNode: function(node, chain){
                        if(nextHandler){
                            nextHandler.endOuterNode(node, nextChain);
                        }
                    },
                    endSelection: function(chain){
                        if(nextHandler){
                            nextHandler.endSelection(nextChain);
                        }
                    }
                });
            } else {
                return new RTEExt.rte.selection.pipeline.PipelineChain(null);
            }
        }
    });
})();
