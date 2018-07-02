RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.ui = RTEExt.rte.ui || {};
(function(CUI, $){
    "use strict";

    RTEExt.rte.ui.ToolbarProxyFactory = new Class({
        toString: 'ToolbarProxyFactory',

        extend: RTEExt.rte.proxy.ObjectExtensionProxyFactory,

        getExtension: function(){
            return {
                _handleScrolling: function(target, event){
                    if(!this.editorKernel.tbBuilder.uiSettings[this.tbType].selectionToolbar){
                        console.log('calling original handle scrolling.');
                        target(event);
                    } else {
                        console.log('TODO: reposition selection toolbar.');
                    }
                }
            };
        }
    });
})(window.CUI, window.jQuery);
