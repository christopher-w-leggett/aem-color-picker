RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    //TODO: need normalizing handler
    RTEExt.rte.selection.pipeline.NormalizingHandler = new Class({
        toString: 'NormalizingHandler',

        extend: RTEExt.rte.selection.pipeline.Handler,

        construct: function(){
        },

        startSelection: function(chain){
            chain.next().startSelection(chain);
        },

        beginInnerNode: function(node, chain){
            chain.next().beginInnerNode(node, chain);
        },

        endInnerNode: function(node, chain){
            chain.next().endInnerNode(node, chain);
        },

        beginOuterNode: function(node, chain){
            chain.next().beginOuterNode(node, chain);
        },

        endOuterNode: function(node, chain){
            chain.next().endOuterNode(node, chain);
        },

        endSelection: function(chain){
            chain.next().endSelection(chain);
        }
    });
})();
