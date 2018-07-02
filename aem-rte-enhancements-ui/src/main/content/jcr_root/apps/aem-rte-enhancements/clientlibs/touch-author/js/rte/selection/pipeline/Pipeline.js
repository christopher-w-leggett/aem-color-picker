RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.Pipeline = new Class({
        toString: 'Pipeline',

        _generator: null,

        _transformers: null,

        _serializer: null,

        _pipelineChainFactory: null,

        construct: function(generator, serializer){
            this._generator = generator;
            this._transformers = [];
            this._serializer = serializer;
            this._pipelineChainFactory = new RTEExt.rte.selection.pipeline.PipelineChainFactory();
        },

        addTransformer: function(transformer){
            if(transformer){
                this._transformers.push(transformer);
            }
        },

        run: function(){
            const handlers = this._transformers.slice();

            //only run if we have generator and serializer
            if(this._generator && this._serializer){
                //add serializer to handlers array
                handlers.push(this._serializer);

                //create pipeline chain
                const pipelineChain = this._pipelineChainFactory.create(handlers);

                //call generator with chain
                this._generator.generate(pipelineChain);
            }
        }
    });
})();
