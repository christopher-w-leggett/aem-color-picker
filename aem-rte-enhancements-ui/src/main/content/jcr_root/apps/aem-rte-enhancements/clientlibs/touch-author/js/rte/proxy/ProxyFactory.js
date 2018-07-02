RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.proxy = RTEExt.rte.proxy || {};
(function(CUI){
    "use strict";

    RTEExt.rte.proxy.ProxyFactory = new Class({
        toString: 'ProxyFactory',

        create: function(obj){
            //must be overridden
            return null;
        }
    });
})(window.CUI);