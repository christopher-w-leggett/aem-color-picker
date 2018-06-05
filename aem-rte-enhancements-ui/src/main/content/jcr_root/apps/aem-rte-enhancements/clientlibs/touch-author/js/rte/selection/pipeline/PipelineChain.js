RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.PipelineChain = new Class({
        toString: 'PipelineChain',

        _handler: null,

        construct: function(handler){
            this._handler = handler;
        },

        next: function(){
            return this._handler;
        }
    });
})();
