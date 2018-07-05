RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    const COMMAND_NAME = 'markup';

    RTEExt.rte.commands.EnforceMarkup = new Class({
        toString: 'EnforceMarkup',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            const cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK;
        },

        execute: function(execDef){
            const root = execDef.editContext.root,
                policies = execDef.value || {},
                defaultEditBlockTagName = execDef.component.htmlRules.blockHandling.defaultEditBlockType;

            this.enforceSubtree(root, policies, {
                root: execDef.editContext.root,
                defaultTagName: defaultEditBlockTagName
            }, {
                editContext: execDef.editContext,
                bookmark: execDef.bookmark
            });
        },

        enforceSubtree: function(node, policies, elementSettings, textNodeSettings){
            let curChild = node.firstChild;

            while(curChild){
                //track a marker node so we can get the next child if our current child is stripped out.
                const markerNode = curChild.previousSibling || node;

                //enforce current child (if child is removed, null is returned)
                if(curChild.nodeType === 1){
                    curChild = this.enforceElement(curChild, policies, elementSettings);
                } else if(curChild.nodeType === 3){
                    curChild = this.enforceTextNode(curChild, policies, textNodeSettings);
                }

                //continue processing subtree
                if(curChild){
                    //current child was not stripped so continue down tree.
                    this.enforceSubtree(curChild, policies, elementSettings, textNodeSettings);
                    curChild = curChild.nextSibling;
                }else{
                    //current child was stripped out, so just move to next sibling using marker node.
                    curChild = markerNode === node ? markerNode.firstChild : markerNode.nextSibling;
                }
            }
        },

        enforceElement: function(node, policies, elementSettings){
            let enforcedNode = node;

            //enforce tag
            const activePolicy = this.getActivePolicy(enforcedNode, policies);
            if(activePolicy.policy !== 'allow'){
                if(enforcedNode.parentNode === elementSettings.root){
                    //don't put text directly under root.
                    enforcedNode = RTEExt.rte.Utils.convertTagName(enforcedNode, elementSettings.defaultTagName);
                }else{
                    RTEExt.rte.Utils.unwrap(enforcedNode);
                    enforcedNode = null;
                }
            }

            if(enforcedNode){
                //enforce styles
                for(let i = enforcedNode.style.length - 1; i >= 0; i--){
                    const stylePolicy = this.getStylePolicy(enforcedNode.style[i], activePolicy);
                    if(stylePolicy.values && stylePolicy.values.length){
                        if(stylePolicy.policy === 'allow' && !stylePolicy.values.includes(enforcedNode.style[enforcedNode.style[i]])){
                            enforcedNode.style.removeProperty(enforcedNode.style[i]);
                        } else if(stylePolicy.policy !== 'allow' && stylePolicy.values.includes(enforcedNode.style[enforcedNode.style[i]])){
                            enforcedNode.style.removeProperty(enforcedNode.style[i]);
                        }
                    } else if(stylePolicy.policy !== 'allow'){
                        enforcedNode.style.removeProperty(enforcedNode.style[i]);
                    }
                }

                //enforce attributes
                for(let i = enforcedNode.attributes.length - 1; i >= 0; i--){
                    const attributeName = enforcedNode.attributes[i].nodeName;
                    if(attributeName !== 'style' && !attributeName.startsWith('_rte')){
                        const attributePolicy = this.getAttributePolicy(attributeName, activePolicy);
                        if(attributePolicy.values && attributePolicy.values.length){
                            const attributeValues = attributePolicy.split
                                ? enforcedNode.attributes[i].value.split(attributePolicy.split)
                                : [enforcedNode.attributes[i].value]
                            if(attributePolicy.policy === 'allow'){
                                for(let j = attributeValues.length - 1; j >= 0; j--){
                                    if(!attributePolicy.values.includes(attributeValues[j])){
                                        attributeValues.splice(attributeValues.indexOf(attributeValues[j]), 1);
                                    }
                                }
                            } else {
                                for(let j = attributeValues.length - 1; j >= 0; j--){
                                    if(attributePolicy.values.includes(attributeValues[j])){
                                        attributeValues.splice(attributeValues.indexOf(attributeValues[j]), 1);
                                    }
                                }
                            }

                            if(attributeValues.length){
                                enforcedNode.attributes[i].value = attributePolicy.split
                                    ? attributeValues.join(attributePolicy.split)
                                    : attributeValues[0];
                            } else {
                                enforcedNode.removeAttribute(attributeName);
                            }
                        } else if(attributePolicy.policy !== 'allow'){
                            enforcedNode.removeAttribute(attributeName);
                        }
                    } else if(attributeName === 'style' && enforcedNode.attributes[i].value === ''){
                        //strip empty style
                        enforcedNode.removeAttribute(attributeName);
                    }
                }
            }

            return enforcedNode;
        },

        enforceTextNode: function(node, policies, textNodeSettings){
            const characterPolicies = policies.characterPolicies || [];
            let enforcedNode = node,
                processedText = enforcedNode.textContent;

            for(let i = 0; i < characterPolicies.length; i++){
                let policy = characterPolicies[i];
                if(policy.match){
                    let lastMatchIndex = processedText.indexOf(policy.match);
                    while(lastMatchIndex > -1){
                        processedText = processedText.replace(policy.match, policy.replacement);
                        lastMatchIndex = processedText.indexOf(policy.match);
                    }
                }
            }

            if(processedText !== enforcedNode.textContent){
                //adjust bookmark
                textNodeSettings.bookmark.startPos += processedText.length - enforcedNode.textContent.length;

                //adjust text content
                if(processedText){
                    //handle scenario where processed text ends with space
                    if(processedText.endsWith(' ')){
                        processedText = processedText.substring(0, processedText.length - 1)
                            + CUI.rte.DomProcessor.NBSP;
                    }

                    enforcedNode.textContent = processedText;
                } else {
                    //remove node
                    let parentNode = enforcedNode.parentNode;
                    parentNode.removeChild(enforcedNode);
                    enforcedNode = null;

                    //if parent no longer contains children, create placeholder node
                    if(!parentNode.firstChild){
                        const emptyPlaceholderNode = CUI.rte.DomProcessor.createEmptyLinePlaceholder(
                            textNodeSettings.editContext, false
                        );
                        if(emptyPlaceholderNode){
                            enforcedNode = parentNode.appendChild(emptyPlaceholderNode);
                        }
                    }
                }
            }

            return enforcedNode;
        },

        getActivePolicy: function(node, policies){
            const tagPolicy = policies.tagPolicies[node.tagName.toLowerCase()],
                wildcardPolicy = policies.tagPolicies['+'],
                policy = tagPolicy || wildcardPolicy || { 'policy': 'deny' };

            if(!policy.stylePolicies){
                policy.stylePolicies = policies.stylePolicies || {};
            }

            if(!policy.attributePolicies){
                policy.attributePolicies = policies.attributePolicies || {};
            }

            return policy;
        },

        getStylePolicy: function(style, activePolicy){
            return activePolicy.stylePolicies[style] || activePolicy.stylePolicies['+'] || { 'policy': 'deny' };
        },

        getAttributePolicy: function(attribute, activePolicy){
            return activePolicy.attributePolicies[attribute] || activePolicy.attributePolicies['+'] || { 'policy': 'deny' };
        }
    });

    RTEExt.rte.commands.EnforceMarkup.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.EnforceMarkup
    );
})(window.CUI);
