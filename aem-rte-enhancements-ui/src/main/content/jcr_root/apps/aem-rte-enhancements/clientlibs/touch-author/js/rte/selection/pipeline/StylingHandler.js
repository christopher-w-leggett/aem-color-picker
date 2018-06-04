RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.selection = RTEExt.rte.selection || {};
RTEExt.rte.selection.pipeline = RTEExt.rte.selection.pipeline || {};
(function(){
    "use strict";

    RTEExt.rte.selection.pipeline.StylingHandler = new Class({
        toString: 'StylingHandler',

        extend: RTEExt.rte.selection.pipeline.Handler,

        _stylingTagName: null,

        _styles: null,

        _originalTree: null,

        _styledTree: null,

        _activeStylingNode: null,

        construct: function(stylingTagName, styles){
            this._stylingTagName = stylingTagName;
            this._styles = styles;
            this._originalTree = [];
            this._styledTree = [];
        },

        startSelection: function(chain){
            //move to next handler
            chain.next().startSelection(chain);
        },

        beginInnerNode: function(node, chain){
            var clonedNode = RTEExt.rte.Utils.cloneNode(node);

            if(this._isContainer(node)){
                this._closeStylingNode(chain);
            } else if(!this._activeStylingNode) {
                this._openStylingNode(clonedNode, chain);
            } else if(this._isStylingNode(clonedNode)){
                //we encountered a styling node within our open styling node, so flatten the structure
                this._closeStylingNode(chain);
                this._openStylingNode(clonedNode, chain);
            }

            //track original and cloned node (if it wasn't added as the active styling node)
            this._originalTree.push(node);
            if(!this._isStylingNode(clonedNode)){
                this._stripStyles(clonedNode);
                this._styledTree.push(clonedNode);
                chain.next().beginInnerNode(clonedNode, chain);
            }
        },

        endInnerNode: function(node, chain){
            //close styling node if node is container node or styling container node.
            //also close if we are leaving a styling node from the original tree because we have flattened this.
            if(this._isContainer(node) || this._isStylingNode(this._originalTree[this._originalTree.length - 1])){
                this._closeStylingNode(chain);
            } else if(this._styledTree[this._styledTree.length - 1] === this._activeStylingNode){
                //we are moving out of active styled node, so clear it
                this._activeStylingNode = null;
            }

            //update original tree
            this._originalTree.pop();

            //move to next handler, send last node from styled tree
            chain.next().endInnerNode(this._styledTree.pop(), chain);
        },

        beginOuterNode: function(node, chain){
            var clonedNode = RTEExt.rte.Utils.cloneNode(node);

            //close open styling node
            if(this._activeStylingNode){
                this._closeStylingNode(chain);
            }

            //track original and cloned node
            this._originalTree.push(node);
            this._styledTree.push(clonedNode);

            //move to next handler
            chain.next().beginOuterNode(clonedNode, chain);
        },

        endOuterNode: function(node, chain){
            //close open styling node
            if(this._activeStylingNode){
                this._closeStylingNode(chain);
            }

            //update original
            this._originalTree.pop();

            //move to next handler, send last node from styled tree
            chain.next().endOuterNode(this._styledTree.pop(), chain);
        },

        endSelection: function(chain){
            //close open styling node
            if(this._activeStylingNode){
                this._closeStylingNode(chain);
            }

            //move to next handler
            chain.next().endSelection(chain);
        },

        /**
         * Opens a new styling node and rebuilds active tree as necessary.
         */
        _openStylingNode: function(node, chain){
            var containerTree = this._getContainerTree(),
                currentStyling = this._getAggregateStyling(node, containerTree),
                tempNode;

            //move styled tree up to first container node or styling container node.
            while(this._styledTree.length && !this._isContainer(this._styledTree[this._styledTree.length - 1])){
                chain.next().endInnerNode(this._styledTree.pop(), chain);
            }

            //create styling node
            this._activeStylingNode = document.createElement(this._stylingTagName);
            this._applyStyles(this._activeStylingNode, currentStyling);
            this._applyStyles(this._activeStylingNode);
            this._styledTree.push(this._activeStylingNode);
            chain.next().beginInnerNode(this._activeStylingNode, chain);

            //now recreate container tree, stripping styles and avoiding nested styling tags.
            while(containerTree.length){
                tempNode = containerTree.shift();
                if(!this._isStylingNode(tempNode)){
                    this._stripStyles(tempNode);
                    this._styledTree.push(tempNode);
                    chain.next().beginInnerNode(tempNode, chain);
                }
            }
        },

        /**
         * Closes any open styling node and rebuilds active tree as necessary.
         */
        _closeStylingNode: function(chain){
            var containerTree = this._getContainerTree(),
                tempNode;

            //move styled tree up to first container node or styling container node.
            while(this._styledTree.length && !this._isContainer(this._styledTree[this._styledTree.length - 1])){
                chain.next().endInnerNode(this._styledTree.pop(), chain);
            }

            //clear active styling node
            this._activeStylingNode = null;

            //now recreate container tree
            while(containerTree.length){
                tempNode = containerTree.shift();
                this._styledTree.push(tempNode);
                chain.next().beginInnerNode(tempNode, chain);
            }
        },

        /**
         * Applies styles to a node.
         */
        _applyStyles: function(node, styles){
            var activeStyles = styles || this._styles,
                curStyle;

            if(node && node.style){
                for(curStyle in activeStyles){
                    if(activeStyles.hasOwnProperty(curStyle)){
                        node.style[curStyle] = activeStyles[curStyle];
                    }
                }
            }
        },

        /**
         * Removes styles from a node.
         */
        _stripStyles: function(node){
            var curStyle;

            if(node && node.style){
                for(curStyle in this._styles){
                    if(this._styles.hasOwnProperty(curStyle)){
                        node.style[curStyle] = '';
                    }
                }
            }
        },

        /**
         * Checks if a node is a styling node.  A styling node shares the stylingTagName and isn't an AEM
         * placeholder node.
         */
        _isStylingNode: function(node){
            //a styling node shares the same styling tag name
            var stylingNode = node.tagName && node.tagName.toLowerCase() === this._stylingTagName,
                i;

            //and doesn't contain an _rte attribute
            for(i = 0; stylingNode && i < node.attributes.length; i++){
                stylingNode = !node.attributes[i].name.startsWith('_rte');
            }

            return stylingNode;
        },

        _getAggregateStyling: function(node, tree){
            var styles = {},
                i,
                j;

            //get styles from active node
            if(this._isStylingNode(node)){
                for(i = 0; i < node.style.length; i++){
                    styles[node.style[i]] = node.style[node.style[i]];
                }
            }

            //aggregate styles
            for(i = tree.length - 1; i >= 0; i--){
                if(this._isStylingNode(tree[i])){
                    for(j = 0; j < tree[i].style.length; j++){
                        if(!styles[tree[i].style[j]]){
                            styles[tree[i].style[j]] = tree[i].style[tree[i].style[j]];
                        }
                    }
                }
            }

            return styles;
        },

        /**
         * Gets the localized tree of the current container or styling container.
         */
        _getContainerTree: function(){
            var containerTree = [],
                i;

            //determine container hierarchy.
            i = this._originalTree.length - 1;
            while(i >= 0 && !this._isContainer(this._originalTree[i])){
                //clone and track tree
                containerTree.push(RTEExt.rte.Utils.cloneNode(this._originalTree[i]));

                //reposition
                i--;
            }

            return containerTree.reverse();
        },

        /**
         * Determines if a node is a container node, styling container node, or ignored node.
         */
        _isContainer: function(node){
            return RTEExt.rte.Utils.isContainerNode(node)
                || (node.tagName
                    && node.tagName.toLowerCase() !== this._stylingTagName
                    && RTEExt.rte.Utils.isStylingContainerNode(node))
                || RTEExt.rte.Utils.isIgnoredNode(node);
        }
    });
})();
