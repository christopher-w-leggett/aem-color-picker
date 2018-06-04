RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.HtmlSelectionSerializer = new Class({
        toString: 'HtmlSelectionSerializer',

        extend: RTEExt.rte.selection.pipeline.Handler,

        _root: null,

        _documentFragment: null,

        _writePointer: null,

        construct: function(root){
            this._root = root;
        },

        startSelection: function(chain){
            this._documentFragment = document.createDocumentFragment();
            this._writePointer = this._documentFragment;
        },

        beginInnerNode: function(node, chain){
            this._beginNode(node);
        },

        endInnerNode: function(node, chain){
            this._endNode(node);
        },

        beginOuterNode: function(node, chain){
            this._beginNode(node);
        },

        endOuterNode: function(node, chain){
            this._endNode(node);
        },

        endSelection: function(chain){
            //remove all children of root
            while(this._root.firstChild){
                this._root.removeChild(this._root.firstChild);
            }

            //append document fragment to root
            this._root.appendChild(this._documentFragment);
        },

        _beginNode: function(node){
            //append node
            this._writePointer.appendChild(node);

            //set write pointer to new node
            this._writePointer = node;
        },

        _endNode: function(node){
            //move to parent if we have one
            if(this._writePointer.parentNode){
                this._writePointer = this._writePointer.parentNode;
            }
        }
    });
})();
