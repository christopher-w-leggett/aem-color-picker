RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.features = RTEExt.rte.features || {};
(function(CUI){
    "use strict";

    var NAME = 'markup';

    RTEExt.rte.features.EnforceMarkup = new Class({
        toString: 'EnforceMarkup',

        extend: RTEExt.rte.features.Feature,

        previousMarkup: '',

        getName: function(){
            return NAME;
        },

        getCommands: function(){
            return [RTEExt.rte.commands.EnforceMarkup.COMMAND_NAME];
        },

        notifyConfig: function(config){
            /*
            Config Details:
                1. If tag/style/attribute is not specifically allowed, it will be denied.
                2. A wildcard of '+' may be used as the name for any policy.  Only 1 is allowed per policy group and
                   would mostly be used to reverse the whitelist to a blacklist.  A wildcard policy within the
                   tagPolicies group may not contain any child policies (stylePolicies, attributePolicies).
                3. Missing or empty values array within a styles or attribute policy will indicate that all values are
                   allowed or denied depending on the policy property.

            Example Configuration:
            {
                'tagPolicies': {
                    '<tag> | +': {
                        'policy': 'allow | deny',
                        'stylePolicies': {
                            ...
                        },
                        'attributePolicies': {
                            ...
                        }
                    }
                },
                'stylePolicies': {
                    '<style>': {
                        'policy': 'allow | deny',
                        'values': ['<value>']
                    }
                },
                'attributePolicies': {
                    '<attribute>': {
                        'policy': 'allow | deny',
                        'split': '<split-string>',
                        'values': ['<value>']
                    }
                }
            }
            TODO: Need to review all OOTB RTE plugins and make a sensible default that will support them.
            */
            var defaultConfig = {
                'tagPolicies': {
                    'p': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'div': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h1': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h2': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h3': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h4': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h5': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h6': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'blockquote': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'pre': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'br': {
                        'policy': 'allow'
                    },
                    'span': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'color': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'mark': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'background-color': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'a': {
                        'policy': 'allow',
                        'attributePolicies': {
                            'href': {
                                'policy': 'allow'
                            },
                            'target': {
                                'policy': 'allow',
                                'values': ['_blank']
                            },
                            'title': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'ul': {
                        'policy': 'allow'
                    },
                    'ol': {
                        'policy': 'allow'
                    },
                    'li': {
                        'policy': 'allow'
                    },
                    'b': {
                        'policy': 'allow'
                    },
                    'i': {
                        'policy': 'allow'
                    }
                }
            };
            CUI.rte.Utils.applyDefaults(config, defaultConfig);
            this.config = config;
        },

        updateState: function(selDef){
            if(this.previousMarkup !== selDef.editContext.root.innerHTML){
                this.previousMarkup = selDef.editContext.root.innerHTML;
                this.editorKernel.relayCmd(RTEExt.rte.commands.EnforceMarkup.COMMAND_NAME, this.config);
            }
        }
    });
})(window.CUI);
