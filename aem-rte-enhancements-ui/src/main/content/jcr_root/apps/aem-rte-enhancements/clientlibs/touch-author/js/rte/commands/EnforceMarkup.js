RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'enforcer',
        COMMAND_NAME = 'markup';

    RTEExt.rte.commands.EnforceMarkup = new Class({
        toString: 'EnforceMarkup',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK;
        },

        execute: function(execDef){
            var root = execDef.editContext.root;

            this.enforceSubtree(root, root, execDef.value || {});
        },

        enforceSubtree: function(node, root, policies){
            var curChild = node.firstChild,
                curStyle,
                markerNode;

            while(curChild){
                //track a marker node so we can get the next child if our current child is stripped out.
                markerNode = curChild.previousSibling || node;

                //enforce current child (if child is removed, null is returned)
                curChild = this.enforce(curChild, root, policies);

                //continue processing subtree
                if(curChild){
                    //current child was not stripped so continue down tree.
                    this.enforceSubtree(curChild, root, policies);
                    curChild = curChild.nextSibling;
                }else{
                    //current child was stripped out, so just move to next sibling using marker node.
                    curChild = markerNode === node ? markerNode.firstChild : markerNode.nextSibling;
                }
            }
        },

        enforce: function(node, root, policies){
            var enforcedNode = node,
                markerNode,
                activePolicy,
                stylePolicy,
                attributePolicy,
                attributeName,
                attributeValues,
                i,
                j;

            if(enforcedNode.nodeType && enforcedNode.nodeType === 1){
                //enforce tag
                activePolicy = this.getActivePolicy(enforcedNode, policies);
                if(activePolicy.policy !== 'allow'){
                    if(enforcedNode.parentNode === root){
                        //don't put text directly under root.
                        enforcedNode = RTEExt.rte.Utils.convertTagName(enforcedNode, 'p');
                    }else{
                        RTEExt.rte.Utils.unwrap(enforcedNode);
                        enforcedNode = null;
                    }
                }

                if(enforcedNode){
                    //enforce styles
                    for(i = enforcedNode.style.length - 1; i >= 0; i--){
                        stylePolicy = this.getStylePolicy(enforcedNode.style[i], activePolicy);
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
                    for(i = enforcedNode.attributes.length - 1; i >= 0; i--){
                        attributeName = enforcedNode.attributes[i].nodeName;
                        if(attributeName !== 'style' && !attributeName.startsWith('_rte')){
                            attributePolicy = this.getAttributePolicy(attributeName, activePolicy);
                            if(attributePolicy.values && attributePolicy.values.length){
                                attributeValues = attributePolicy.split
                                    ? enforcedNode.attributes[i].value.split(attributePolicy.split)
                                    : [enforcedNode.attributes[i].value]
                                if(attributePolicy.policy === 'allow'){
                                    for(j = attributeValues.length - 1; j >= 0; j--){
                                        if(!attributePolicy.values.includes(attributeValues[j])){
                                            attributeValues.splice(attributeValues.indexOf(attributeValues[j]), 1);
                                        }
                                    }
                                } else {
                                    for(j = attributeValues.length - 1; j >= 0; j--){
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
            }

            return enforcedNode;
        },

        getActivePolicy: function(node, policies){
            var tagPolicy = policies.tagPolicies[node.tagName.toLowerCase()],
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
