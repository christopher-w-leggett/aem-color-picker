RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.ui = RTEExt.rte.ui || {};
(function(CUI){
    "use strict";

    RTEExt.rte.ui.ToolbarBuilderProxyFactory = new Class({
        toString: 'ToolbarBuilderProxyFactory',

        extend: RTEExt.rte.proxy.ObjectExtensionProxyFactory,

        getExtension: function(){
            return {
                createToolbar: function(target, editorKernel, options){
                    var toolbarProxyFactory = new RTEExt.rte.ui.ToolbarProxyFactory();

                    return toolbarProxyFactory.create(target(editorKernel, options));
                }
            };
        }
    });
})(window.CUI);
