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
            TODO: Need to finish reviewing table plugin which is broken in 6.4.  Need to see if it works in 6.3
            */
            var defaultConfig = {
                'tagPolicies': {
                    'p': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'div': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h1': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h2': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h3': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h4': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h5': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'h6': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'blockquote': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'pre': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'margin-left': {
                                'policy': 'allow'
                            },
                            'text-align': {
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
                            },
                            'border-bottom-width': {
                                'policy': 'allow'
                            },
                            'border-bottom-style': {
                                'policy': 'allow'
                            },
                            'border-bottom-color': {
                                'policy': 'allow'
                            }
                        },
                        'attributePolicies': {
                            'class': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'mark': {
                        'policy': 'allow',
                        'stylePolicies': {
                            'background-color': {
                                'policy': 'allow'
                            },
                            'color': {
                                'policy': 'allow',
                                'values': ['inherit']
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
                            },
                            'id': {
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
                        'policy': 'allow',
                        'stylePolicies': {
                            'text-align': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'b': {
                        'policy': 'allow'
                    },
                    'strong': {
                        'policy': 'allow'
                    },
                    'i': {
                        'policy': 'allow'
                    },
                    'em': {
                        'policy': 'allow'
                    },
                    'u': {
                        'policy': 'allow'
                    },
                    'code': {
                        'policy': 'allow'
                    },
                    's': {
                        'policy': 'allow'
                    },
                    'sub': {
                        'policy': 'allow'
                    },
                    'sup': {
                        'policy': 'allow'
                    },
                    'img': {
                        'policy': 'allow',
                        'stylePolicies': {
                            '+': {
                                'policy': 'allow'
                            }
                        },
                        'attributePolicies': {
                            'src': {
                                'policy': 'allow'
                            },
                            'alt': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'table': {
                        'policy': 'allow',
                        'attributePolicies': {
                            'cellpadding': {
                                'policy': 'allow'
                            },
                            'cellspacing': {
                                'policy': 'allow'
                            },
                            'border': {
                                'policy': 'allow'
                            },
                            'width': {
                                'policy': 'allow'
                            },
                            'height': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'caption': {
                        'policy': 'allow'
                    },
                    'tbody': {
                        'policy': 'allow'
                    },
                    'tr': {
                        'policy': 'allow'
                    },
                    'th': {
                        'policy': 'allow',
                        'attributePolicies': {
                            'scope': {
                                'policy': 'allow'
                            },
                            'colspan': {
                                'policy': 'allow'
                            },
                            'rowspan': {
                                'policy': 'allow'
                            },
                            'class': {
                                'policy': 'allow'
                            }
                        }
                    },
                    'td': {
                        'policy': 'allow',
                        'attributePolicies': {
                            'colspan': {
                                'policy': 'allow'
                            },
                            'rowspan': {
                                'policy': 'allow'
                            },
                            'class': {
                                'policy': 'allow'
                            }
                        }
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
