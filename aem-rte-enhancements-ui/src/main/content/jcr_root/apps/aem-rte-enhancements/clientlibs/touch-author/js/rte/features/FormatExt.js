RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'format-ext';

    RTEExt.rte.features.FormatExt = new Class({
        toString: 'FormatExt',

        extend: RTEExt.rte.features.Feature,

        _formats: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return this._formats.map(function(format){
                return format.name;
            });
        },

        initializeUI: function(tbGenerator, options){
            var plugins = CUI.rte.plugins,
                commandRef,
                i;

            for(i = 0; i < this._formats.length; i++){
                commandRef = RTEExt.rte.Groups.FORMAT_EXT + '#' + this._formats[i].name,

                this._formats[i].ui = tbGenerator.createElement(
                    this._formats[i].name, this.plugin, true, this._formats[i].tooltip
                );
                tbGenerator.addElement(this.plugin.pluginId, plugins.Plugin.SORT_EDIT, this._formats[i].ui, 100);
            }
        },

        notifyConfig: function(config){
            var defaultConfig = {
                    code: {
                        tagName: 'code'
                    },
                    strikethrough: {
                        tagName: 's'
                    }
                },
                defaultFormatTooltip,
                formatName,
                formatTooltip,
                tooltipKeys;
            CUI.rte.Common.removeJcrData(config);
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;

            //build formats
            this._formats = [];
            for(formatName in this.config){
                if(this.config.hasOwnProperty(formatName) && !this.config[formatName].disabled){
                    tooltipKeys = {
                        'title': 'plugins.' + RTEExt.rte.Groups.FORMAT_EXT + '.' + formatName + '.title',
                        'text': 'plugins.' + RTEExt.rte.Groups.FORMAT_EXT + '.' + formatName + '.text'
                    };

                    defaultFormatTooltip = {
                        'title': CUI.rte.Utils.i18n(tooltipKeys.title),
                        'text': CUI.rte.Utils.i18n(tooltipKeys.text)
                    };
                    if(defaultFormatTooltip.title === tooltipKeys.title){
                        defaultFormatTooltip.title = formatName.substring(0, 1).toUpperCase() + formatName.substring(1);
                    }
                    if(defaultFormatTooltip.text === tooltipKeys.text){
                        defaultFormatTooltip.text = formatName.substring(0, 1).toUpperCase() + formatName.substring(1);
                    }
                    formatTooltip = this.config[formatName].tooltip || {};
                    CUI.rte.Utils.applyDefaults(formatTooltip, defaultFormatTooltip);

                    this._formats.push({
                        'name': formatName,
                        'tagName': this.config[formatName].tagName,
                        'tooltip': formatTooltip
                    });
                }
            }
        },

        execute: function(command, value, envOptions){
            var appliedFormat = this._formats.find(function(format){
                    return format.name === command;
                }),
                selectionDef,
                startNodeAncestors,
                endNodeAncestors;

            if(appliedFormat){
                selectionDef = this.editorKernel.analyzeSelection(envOptions.editContext);
                startNodeAncestors = RTEExt.rte.Utils.getAncestors(
                    selectionDef.selection.startNode, envOptions.editContext.root
                );
                endNodeAncestors = RTEExt.rte.Utils.getAncestors(
                    selectionDef.selection.endNode, envOptions.editContext.root
                );

                this.editorKernel.relayCmd(RTEExt.rte.commands.FormatExt.COMMAND_NAME, {
                    'tagName': appliedFormat.tagName,
                    'applyTag': !startNodeAncestors.find(function(node){
                            return node.tagName && node.tagName.toLowerCase() === appliedFormat.tagName;
                        }) || !endNodeAncestors.find(function(node){
                            return node.tagName && node.tagName.toLowerCase() === appliedFormat.tagName;
                        })
                });
            }
        },

        updateState: function(selDef){
            var startNodeAncestors = RTEExt.rte.Utils.getAncestors(
                    selDef.selection.startNode, selDef.editContext.root
                ),
                endNodeAncestors = RTEExt.rte.Utils.getAncestors(
                    selDef.selection.endNode, selDef.editContext.root
                );

            this._formats.forEach(function(format){
                format.ui.setSelected(!!startNodeAncestors.find(function(node){
                    return node.tagName && node.tagName.toLowerCase() === format.tagName;
                }) && !!endNodeAncestors.find(function(node){
                    return node.tagName && node.tagName.toLowerCase() === format.tagName;
                }));
            });
        }
    });
})(window.CUI);
