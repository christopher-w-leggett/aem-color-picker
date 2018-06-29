RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.ui = RTEExt.rte.ui || {};
(function(CUI){
    "use strict";

    var delegateToolkitName = CUI.rte._toolkit || CUI.rte.EditorKernel.DEFAULT_TOOLKIT;

    RTEExt.rte.ui.UIToolkit = new Class({
        toString: 'UIToolkit',

        extend: CUI.rte.ui.Toolkit,

        _delegate: null,

        initialize: function(callback){
            this._delegate = CUI.rte.ui.ToolkitRegistry.get(delegateToolkitName);
            callback();
        },

        requiresInit: function(){
            return true;
        },

        createToolbarBuilder: function(hint){
            return this._delegate.createToolbarBuilder(hint);
        },

        createContextMenuBuilder: function(editorKernel){
            return this._delegate.createContextMenuBuilder(editorKernel);
        },

        createDialogManager: function(editorKernel){
            return this._delegate.createDialogManager(editorKernel);
        }
    });

    CUI.rte.ui.ToolkitRegistry.register('rte-ext', RTEExt.rte.ui.UIToolkit);
    CUI.rte.ui.ToolkitRegistry.initialize('rte-ext');
})(window.CUI);