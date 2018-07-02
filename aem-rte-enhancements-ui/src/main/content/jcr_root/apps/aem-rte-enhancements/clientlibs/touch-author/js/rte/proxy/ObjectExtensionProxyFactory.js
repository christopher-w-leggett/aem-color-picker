RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.proxy = RTEExt.rte.proxy || {};
(function(CUI){
    "use strict";

    RTEExt.rte.proxy.ObjectExtensionProxyFactory = new Class({
        toString: 'ObjectExtensionProxyFactory',

        extend: RTEExt.rte.proxy.ProxyFactory,

        create: function(obj){
            var extension = this.getExtension();

            return new Proxy(obj, {
                get: function(target, prop, receiver){
                    if(extension[prop] && typeof extension[prop] === 'function'){
                        return extension[prop].bind(receiver, Reflect.get(...arguments).bind(target));
                    } else {
                        return Reflect.get(...arguments);
                    }
                }
            });
        },

        getExtension: function(){
            //must be overridden
            return {};
        }
    });
})(window.CUI);