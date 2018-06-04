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

        /* TODO:
        <p>
            text
            <b>
                <i>
                    some text
                    <a><span>styled</span> link</a>
                    and after text
                </i>
            </b>
            post text
        </p>
        */
        beginInnerNode: function(node, chain){
            var clonedNode = RTEExt.rte.Utils.cloneNode(node);

            if(RTEExt.rte.Utils.isContainerNode(node)
                || RTEExt.rte.Utils.isStylingContainerNode(node)
                || RTEExt.rte.Utils.isIgnoredNode(node)){
                this._closeStylingNode(chain);
            } else if(!this._activeStylingNode) {
                this._openStylingNode(clonedNode, chain);
            }

            //track original and cloned node (if it wasn't added as the active styling node)
            this._originalTree.push(node);
            if(clonedNode !== this._activeStylingNode){
                this._styledTree.push(clonedNode);

                //only send clone to next handler if it wasn't used as the active styling node.
                chain.next().beginInnerNode(clonedNode, chain);
            }
        },

        endInnerNode: function(node, chain){
            //close styling node if node is container node or styling container node.
            if(RTEExt.rte.Utils.isContainerNode(node)
                || RTEExt.rte.Utils.isStylingContainerNode(node)
                || RTEExt.rte.Utils.isIgnoredNode(node)){
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
         * Opens a new styling node, if one is not open, and rebuilds active tree as necessary.
         */
        _openStylingNode: function(stylingNode, chain){
            var tempTree,
                i;

            //determine any hierarchy that will need to be recreated.
            tempTree = [];
            i = this._originalTree.length - 1;
            while(i >= 0
                && !RTEExt.rte.Utils.isContainerNode(this._originalTree[i])
                && !RTEExt.rte.Utils.isStylingContainerNode(this._originalTree[i])){
                //clone and track tree
                tempTree.push(RTEExt.rte.Utils.cloneNode(this._originalTree[i]));

                //reposition
                i--;
            }

            //move styled tree up to first container node or styling container node.
            while(this._styledTree.length
                && !RTEExt.rte.Utils.isContainerNode(this._styledTree[this._styledTree.length - 1])
                && !RTEExt.rte.Utils.isStylingContainerNode(this._styledTree[this._styledTree.length - 1])){
                chain.next().endInnerNode(this._styledTree.pop(), chain);
            }

            //set or create styling node
            if(tempTree.length && this._isStylingNode(tempTree[tempTree.length - 1])){
                this._activeStylingNode = tempTree.pop();
            } else if(!tempTree.length && this._isStylingNode(stylingNode)){
                this._activeStylingNode = stylingNode;
            } else {
                this._activeStylingNode = document.createElement(this._stylingTagName);
            }
            this._applyStyles(this._activeStylingNode);
            this._styledTree.push(this._activeStylingNode);
            chain.next().beginInnerNode(this._activeStylingNode, chain);

            //now recreate hierarchy, stripping styles
            for(i = tempTree.length - 1; i >=0; i--){
                this._stripStyles(tempTree[i]);
                this._styledTree.push(tempTree[i]);
                chain.next().beginInnerNode(tempTree[i], chain);
            }
        },

        /**
         * Closes any open styling node and rebuilds active tree as necessary.
         */
        _closeStylingNode: function(chain){
            var tempTree,
                i;

            //determine any hierarchy that will need to be recreated.
            tempTree = [];
            i = this._originalTree.length - 1;
            while(i >= 0
                && !RTEExt.rte.Utils.isContainerNode(this._originalTree[i])
                && !RTEExt.rte.Utils.isStylingContainerNode(this._originalTree[i])){
                //clone and track tree
                tempTree.push(RTEExt.rte.Utils.cloneNode(this._originalTree[i]));

                //reposition
                i--;
            }

            //move styled tree up to first container node or styling container node.
            while(this._styledTree.length
                && !RTEExt.rte.Utils.isContainerNode(this._styledTree[this._styledTree.length - 1])
                && !RTEExt.rte.Utils.isStylingContainerNode(this._styledTree[this._styledTree.length - 1])){
                chain.next().endInnerNode(this._styledTree.pop(), chain);
            }

            //clear active styling node
            this._activeStylingNode = null;

            //now recreate hierarchy
            for(i = tempTree.length - 1; i >=0; i--){
                this._styledTree.push(tempTree[i]);
                chain.next().beginInnerNode(tempTree[i], chain);
            }
        },

        /**
         * Applies styles to a node.
         */
        _applyStyles: function(node){
            var curStyle;

            if(node && node.style){
                for(curStyle in this._styles){
                    if(this._styles.hasOwnProperty(curStyle)){
                        node.style[curStyle] = this._styles[curStyle];
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
        }
    });
})();
