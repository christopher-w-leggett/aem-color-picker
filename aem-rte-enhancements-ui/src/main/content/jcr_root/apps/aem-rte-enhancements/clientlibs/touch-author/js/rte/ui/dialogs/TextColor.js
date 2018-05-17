RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.ui = RTEExt.rte.ui || {};
RTEExt.rte.ui.dialogs = RTEExt.rte.ui.dialogs || {};
(function(CUI){
    "use strict";

    var DATA_TYPE = 'text-color';

    RTEExt.rte.ui.dialogs.TextColor = new Class({
        toString: 'TextColor',

        extend: CUI.rte.ui.cui.AbstractBaseDialog,

        colorInput: null,

        applyFunction: null,

        getDataType: function(){
            return DATA_TYPE;
        },

        initialize: function(config){
            this.applyFunction = config.execute;
            this.colorInput = this.$container.find('coral-colorinput[data-type="' + DATA_TYPE + '"]')[0];
        },

        setColor: function(color){
            this.colorInput.value = color || '';
        },

        apply: function(){
            this.applyFunction(this.colorInput.value);
            this.hide();
        },

        onHide: function(){
            this.colorInput.querySelector('coral-overlay').open = false;
        }
    });

    //register dialog template.
    Coral.templates.RichTextEditor['dlg_' + DATA_TYPE] = function(config){
        var dialogFragment = document.createDocumentFragment();

        //create column container
        var columnContainer = document.createElement('div');
        columnContainer.className = 'rte-dialog-columnContainer';

        //create color input field
        var colorInputColumn = document.createElement('div');
        colorInputColumn.className = 'rte-dialog-column';
        var colorInput = document.createElement('coral-colorinput');
        colorInput.setAttribute('data-type', DATA_TYPE);
        colorInput.setAttribute('variant', config.variant);
        if(config.variant === 'swatch'){
            colorInput.setAttribute('style', 'vertical-align: middle;');
        }
        colorInput.setAttribute('autogeneratecolors', config.autogeneratecolors);
        colorInput.setAttribute('showdefaultcolors', config.showdefaultcolors);
        colorInput.setAttribute('showswatches', config.showswatches);
        colorInput.setAttribute('showproperties', config.showproperties);
        colorInput.setAttribute('placeholder', config.placeholder);
        for(var i = 0; i < config.colors.length; i++){
            var colorInputItem = document.createElement('coral-colorinput-item');
            colorInputItem.setAttribute('value', config.colors[i]);
            colorInput.appendChild(colorInputItem);
        }
        colorInputColumn.appendChild(colorInput);
        columnContainer.appendChild(colorInputColumn);

        //create cancel button
        var cancelButtonColumn = document.createElement('div');
        cancelButtonColumn.className = 'rte-dialog-column';
        var cancelButton = document.createElement('button', 'coral-button');
        cancelButton.setAttribute('is', 'coral-button');
        cancelButton.setAttribute('icon', 'close');
        cancelButton.setAttribute('title', CUI.rte.Utils.i18n('dialog.cancel'));
        cancelButton.setAttribute('aria-label', CUI.rte.Utils.i18n('dialog.cancel'));
        cancelButton.setAttribute('iconsize', 'S');
        cancelButton.setAttribute('data-type', 'cancel');
        cancelButton.setAttribute('tabindex', '-1');
        cancelButtonColumn.appendChild(cancelButton);
        columnContainer.appendChild(cancelButtonColumn);

        //create apply button
        var applyButtonColumn = document.createElement('div');
        applyButtonColumn.className = 'rte-dialog-column';
        var applyButton = document.createElement('button', 'coral-button');
        applyButton.setAttribute('is', 'coral-button');
        applyButton.setAttribute('icon', 'check');
        applyButton.setAttribute('title', CUI.rte.Utils.i18n('dialog.apply'));
        applyButton.setAttribute('aria-label', CUI.rte.Utils.i18n('dialog.apply'));
        applyButton.setAttribute('iconsize', 'S');
        applyButton.setAttribute('variant', 'primary');
        applyButton.setAttribute('data-type', 'apply');
        applyButton.setAttribute('tabindex', '-1');
        applyButtonColumn.appendChild(applyButton);
        columnContainer.appendChild(applyButtonColumn);

        //append column container to dialog
        dialogFragment.appendChild(columnContainer);

        return dialogFragment;
    };
})(window.CUI);
