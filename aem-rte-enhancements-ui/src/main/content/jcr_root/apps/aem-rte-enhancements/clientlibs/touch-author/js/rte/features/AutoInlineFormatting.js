RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI){
    "use strict";

    const NAME = 'inline';

    //TODO: Inline links?
    RTEExt.rte.features.AutoInlineFormatting = new Class({
        toString: 'AutoInlineFormatting',

        extend: RTEExt.rte.features.Feature,

        _activationKeys: null,

        _formatting: null,

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME];
        },

        notifyConfig: function(config){
            const defaultConfig = {
                    inlineElementMapping: {
                        bold: {
                            charPattern: ['**', '__'],
                            tagName: 'b'
                        },
                        italic: {
                            charPattern: ['*', '_'],
                            tagName: 'i'
                        },
                        code: {
                            charPattern: ['`'],
                            tagName: 'code'
                        },
                        strikethrough: {
                            charPattern: ['~~'],
                            tagName: 's'
                        }
                    }
                };
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;

            //initialize properties
            this._activationKeys = {};
            this._formatting = [];
            for(let prop in this.config.inlineElementMapping){
                if(this.config.inlineElementMapping.hasOwnProperty(prop)
                    && !this.config.inlineElementMapping[prop].disabled){
                    this.config.inlineElementMapping[prop].charPattern.forEach(function(pattern){
                        //add activation key
                        this._activationKeys[pattern[pattern.length - 1]] = true;

                        //track formatting option
                        this._formatting.push({
                            charPattern: pattern,
                            tagName: this.config.inlineElementMapping[prop].tagName
                        });
                    }.bind(this));
                }
            }
            this._formatting.sort(function(a, b){
                return b.charPattern - a.charPattern;
            });

            //register listeners
            this.editorKernel.addPluginListener('keyup', this._keyup, this, this.plugin, false);
        },

        _keyup: function(event){
            const key = event.nativeEvent.key,
                selection = CUI.rte.Selection.createProcessingSelection(event.editContext),
                cursorNode = selection.startNode;

            //continue if we hit an activation key
            if(this._activationKeys[key] && cursorNode && cursorNode.nodeType === 3){
                //find matching formats from our configuration
                const matchingFormats = this._findMatchingFormats(key);

                //determine if formatting can be applied
                if(matchingFormats && matchingFormats.length){
                    //find activated format
                    const activatedFormat = this._findActivatedFormat(cursorNode, selection.startOffset, matchingFormats);

                    //find the closest node/offset of the matching formats.
                    const beginningFormatDef = this._findBeginningFormatDef(
                        cursorNode, selection.startOffset, matchingFormats
                    );

                    //perform styling if there is a matching start format, the distance is greater than 0,
                    //and it matches the activated format.
                    if(beginningFormatDef
                        && beginningFormatDef.distance > 0
                        && beginningFormatDef.format === activatedFormat){
                        //mark undo step for correct undo behavior prior to modifying markup
                        this.editorKernel.relayCmd('addundostep');

                        //send command to modify markup
                        this.editorKernel.relayCmd(RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME, {
                            startNode: beginningFormatDef.textNode,
                            startOffset: beginningFormatDef.offset,
                            endNode: cursorNode,
                            endOffset: selection.startOffset,
                            format: activatedFormat
                        });
                    }
                }
            }
        },

        _findMatchingFormats: function(key){
            const matchingFormats = [];

            //a matching format is any whose charPattern ends with the activation key
            this._formatting.forEach(function(format){
                if(format.charPattern.endsWith(key)){
                    matchingFormats.push(format);
                }
            }.bind(this));

            return matchingFormats;
        },

        _findActivatedFormat: function(textNode, offset, formats){
            //activated format is the longest matching charPattern
            return formats.find(function(format){
                return this._isPattern(textNode, offset, format.charPattern);
            }.bind(this));
        },

        _findBeginningFormatDef: function(textNode, offset, formats){
            let formatDef = null;

            //for each format, find the beginning position and if position is closer than the previous, use it
            //don't use format if the closest is right before the actual position.
            formats.forEach(function(format){
                const startPosition = this._moveBack(textNode, offset, format.charPattern.length);
                if(startPosition){
                    const positionDef = this._findPatternStartPosition(
                        startPosition.textNode, startPosition.offset, format.charPattern
                    );
                    if(positionDef && positionDef.distance > 0
                        && (!formatDef || formatDef.distance > positionDef.distance)){
                        formatDef = {
                            textNode: positionDef.textNode,
                            offset: positionDef.offset,
                            distance: positionDef.distance,
                            format: format
                        };
                    }
                }
            }.bind(this));

            return formatDef;
        },

        /**
         * Will move the current position back a number of characters.
         */
        _moveBack: function(textNode, offset, numCharacters){
            let curNode = textNode,
                curOffset = offset,
                remainingCharacters = numCharacters;

            while(curNode && remainingCharacters > 0){
                if(curOffset >= remainingCharacters){
                    //current node has enough characters to move back.
                    curOffset -= remainingCharacters;
                    remainingCharacters = 0;
                } else {
                    //we need to subtract the number of characters in the current node from the remaining characters
                    //and then move back to a previous text node.
                    remainingCharacters -= curOffset;
                    do {
                        //move to previous sibling (which may be a parents previous sibling)
                        let previousNode = curNode.previousSibling;
                        while(!previousNode && !RTEExt.rte.Utils.isContainerNode(curNode.parentNode)){
                            //move current node up
                            curNode = curNode.parentNode;

                            //get previous sibling of parent
                            previousNode = curNode.previousSibling;
                        }

                        //move down into previous nodes last child
                        while(previousNode && previousNode.lastChild){
                            previousNode = previousNode.lastChild;
                        }

                        //set current node
                        curNode = previousNode;
                    } while(curNode && curNode.nodeType !== 3);
                    curOffset = curNode ? curNode.textContent.length : null;
                }
            }

            if(curNode){
                return {
                    textNode: curNode,
                    offset: curOffset
                };
            } else {
                return null;
            }
        },

        _findPatternStartPosition: function(textNode, offset, pattern){
            let positionDef = null,
                curNode = textNode,
                curOffset = offset,
                aggregateTextContent = '';

            //aggregate all text content of current container
            while(curNode){
                if(curOffset !== null){
                    aggregateTextContent = curNode.textContent.substring(0, curOffset) + aggregateTextContent;
                } else {
                    aggregateTextContent = curNode.textContent + aggregateTextContent;
                }

                do {
                    //move to previous sibling (which may be a parents previous sibling)
                    let previousNode = curNode.previousSibling;
                    while(!previousNode && !RTEExt.rte.Utils.isContainerNode(curNode.parentNode)){
                        //move current node up
                        curNode = curNode.parentNode;

                        //get previous sibling of parent
                        previousNode = curNode.previousSibling;
                    }

                    //move down into previous nodes last child
                    while(previousNode && previousNode.lastChild){
                        previousNode = previousNode.lastChild;
                    }

                    //set current node
                    curNode = previousNode;
                } while(curNode && curNode.nodeType !== 3);

                //clear offset as it is only used for initial node
                curOffset = null;
            }

            //look for match
            const lastIndex = aggregateTextContent.lastIndexOf(pattern);
            if(lastIndex > -1){
                const distance = aggregateTextContent.length - lastIndex;
                positionDef = this._moveBack(textNode, offset, distance);
                positionDef.distance = distance - pattern.length;
            }

            return positionDef;
        },

        _isPattern: function(textNode, offset, pattern){
            let matches = false;

            if(offset >= pattern.length){
                matches = pattern === textNode.textContent.substring(
                    offset - pattern.length, offset
                );
            }

            return matches;
        }
    });
})(window.CUI);
