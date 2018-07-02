RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.ui = RTEExt.rte.ui || {};
(function(CUI){
    "use strict";

    var currentToolkit = CUI.rte.ui.ToolkitRegistry.get(
        CUI.rte._toolkit || CUI.rte.EditorKernel.DEFAULT_TOOLKIT
    );

    RTEExt.rte.ui.ToolkitExtension = currentToolkit.constructor.extend({
        toString: 'ToolkitExtension',

        createToolbarBuilder: function(hint){
            var toolbarBuilderProxyFactory = new RTEExt.rte.ui.ToolbarBuilderProxyFactory();

            return toolbarBuilderProxyFactory.create(this.superClass.createToolbarBuilder(hint));
        }
    });

    CUI.rte.ui.ToolkitRegistry.register('rte-ext', RTEExt.rte.ui.ToolkitExtension);
})(window.CUI);
