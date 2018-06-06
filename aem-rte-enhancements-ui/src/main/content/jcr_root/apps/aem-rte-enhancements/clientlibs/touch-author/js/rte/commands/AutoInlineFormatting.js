RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'auto',
        COMMAND_NAME = 'inline';

    RTEExt.rte.commands.AutoInlineFormatting = new Class({
        toString: 'AutoInlineFormatting',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            //TODO: implement
        }
    });

    RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.AutoInlineFormatting
    );
})(window.CUI);
