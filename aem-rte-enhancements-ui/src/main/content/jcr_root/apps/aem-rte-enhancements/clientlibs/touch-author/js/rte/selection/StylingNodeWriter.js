RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
(function(){
    "use strict";

    RTEExt.rte.StylingNodeWriter = new Class({
        toString: 'StylingNodeWriter',

        _stylingTagName: null,

        _styles: null,

        _stripDef: null,

        _containerTags: [
            'p',
            'div',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'blockquote',
            'pre',
            'li',
            'caption',
            'address',
            'th',
            'td'
        ],

        _stylingContainerTags: [
            'a',
            'mark'
        ],

        _ignoredTags: [
            'ul',
            'ol',
            'table',
            'tbody',
            'thead',
            'tfoot',
            'tr'
        ],

        _styledFragment: null,

        _writePointer: null,

        _stylingNode: null,

        _reopenStylingNodeOnWrite: false,

        _writeTree: [],

        _rebuildWriteTreeOnWrite: false,

        construct: function (stylingTagName, styles) {
            this._stylingTagName = stylingTagName;
            this._styles = styles;
            this._stripDef = this._buildStripDef();
            this._styledFragment = document.createDocumentFragment();
            this._writePointer = this._styledFragment;
        },

        write: function(node){
            var skipAppend = false,
                tempTree,
                i;

            //if I have an open styling node and the node being written is a container, then I need to temporarily
            //close the styling node.
            if(this._stylingNode && (this._isContainerNode(node) || this._isStylingContainerNode(node)
                || this._isIgnoredNode(node))){
                //close styling node
                this.closeStylingNode();

                //set flag to reopen styling node on next write
                this._reopenStylingNodeOnWrite = true;
            }

            //reopen styling node if needed
            if(this._reopenStylingNodeOnWrite && !this._isContainerNode(node)
                && !this._isStylingContainerNode(node) && !this._isIgnoredNode(node)){
                //TODO: see if this can be better, meaning don't expose this ability outside.
                //try to open styling node with node being written if it is a styling node itself
                if(this._isStylingNode(node)){
                    skipAppend = this.openStylingNode(node);
                } else {
                    this.openStylingNode();
                }
            }

            //rebuild hierarchy if needed.
            if(this._rebuildWriteTreeOnWrite){
                //determine any hierarchy that will need to be recreated.
                tempTree = [];
                i = this._writeTree.length - 1;
                while(i >= 0
                    && !this._isContainerNode(this._writeTree[i])
                    && !this._isStylingContainerNode(this._writeTree[i])){
                    //clone and track tree
                    tempTree.push(this._writeTree.pop());

                    //reposition
                    i--;
                }

                //now recreate hierarchy
                for(i = tempTree.length - 1; i >=0; i--){
                    this._writePointer.appendChild(tempTree[i]);
                    this._writePointer = tempTree[i];

                    //restore to write tree if we need to recreate again
                    this._writeTree.push(RTEExt.rte.Utils.cloneNode(tempTree[i]));
                }

                //tree was rebuilt so no need to do it again
                this._rebuildWriteTreeOnWrite = false;
            }

            //append child
            if(!skipAppend){
                this._writePointer.appendChild(RTEExt.rte.Utils.cloneNode(node));
            }
        },

        /**
         * Moves the current write pointer down.
         */
        moveDown: function(){
            if(this._writePointer.lastChild){
                //track active write tree
                this._writeTree.push(RTEExt.rte.Utils.cloneNode(this._writePointer.lastChild));

                //move write pointer
                this._writePointer = this._writePointer.lastChild;
            }
        },

        /**
         * Moves the current write pointer up.
         */
        moveUp: function(){
            if(this._writePointer === this._stylingNode){
                //close styling node
                this.closeStylingNode();

                //if my write tree is moving out of a container node,
                //we need to move the write pointer an additional step up because an
                //additional styling node was created so our write pointer is an additional
                //step down.
                if((this._isContainerNode(this._writeTree[this._writeTree.length - 1]) || this._isStylingContainerNode(this._writeTree[this._writeTree.length - 1]))
                    && this._writePointer.parentNode){
                    //update active write tree
                    this._writeTree.pop();

                    //move writePointer up
                    this._writePointer = this._writePointer.parentNode;
                }
            } else if(this._writePointer.parentNode){
                //update active write tree
                this._writeTree.pop();

                //move writePointer up
                this._writePointer = this._writePointer.parentNode;
            }
        },

        openStylingNode: function(stylingNode){
            var usedProvidedStylingNode = false,
                tempTree,
                i;

            if(!this._stylingNode){
                //determine any hierarchy that will need to be recreated.
                tempTree = [];
                i = this._writeTree.length - 1;
                while(i >= 0
                    && !this._isContainerNode(this._writeTree[i])
                    && !this._isStylingContainerNode(this._writeTree[i])){
                    //clone and track tree
                    tempTree.push(this._writeTree.pop());

                    //reposition
                    i--;
                }

                //we need to move our write pointer up to first container node or styling container node
                while(this._writePointer !== this._styledFragment && !this._isContainerNode(this._writePointer)
                    && !this._isStylingContainerNode(this._writePointer)){
                    //reposition write pointer
                    this._writePointer = this._writePointer.parentNode;
                }

                //set or create styling node
                if(tempTree.length && this._isStylingNode(tempTree[tempTree.length - 1])){
                    this._stylingNode = tempTree.pop();

                    //restore to write tree if we need to recreate again
                    this._writeTree.push(RTEExt.rte.Utils.cloneNode(this._stylingNode));
                } else if(!tempTree.length && stylingNode){
                    this._stylingNode = RTEExt.rte.Utils.cloneNode(stylingNode);
                    usedProvidedStylingNode = true;

                    //provided styling node needs to be tracked in case it needs to be recreated later
                    this._writeTree.push(RTEExt.rte.Utils.cloneNode(this._stylingNode));
                } else {
                    this._stylingNode = document.createElement(this._stylingTagName);
                }
                this._styleNode(this._stylingNode, this._styles);
                this._writePointer.appendChild(this._stylingNode);
                this._writePointer = this._stylingNode;

                //now recreate hierarchy
                for(i = tempTree.length - 1; i >=0; i--){
                    this._writePointer.appendChild(tempTree[i]);
                    this._writePointer = tempTree[i];

                    //restore to write tree if we need to recreate again
                    this._writeTree.push(RTEExt.rte.Utils.cloneNode(tempTree[i]));
                }

                //tree was rebuilt so no need to do it on write
                this._rebuildWriteTreeOnWrite = false;
            }

            return usedProvidedStylingNode;
        },

        closeStylingNode: function(){
            if(this._stylingNode){
                while(this._writePointer !== this._stylingNode){
                    this._writePointer = this._writePointer.parentNode;
                }
                this._writePointer = this._writePointer.parentNode;
                RTEExt.rte.Utils.stripDescendantStyle(this._stylingNode, this._stripDef);
                if(RTEExt.rte.Utils.canUnwrap(this._stylingNode, this._stylingTagName)){
                    RTEExt.rte.Utils.unwrap(this._stylingNode);
                }
                this._stylingNode = null;

                //make sure to rebuild tree
                this._rebuildWriteTreeOnWrite = true;
            }

            //close is specifically called, so don't reopen on write
            this._reopenStylingNodeOnWrite = false;
        },

        /**
         * Returns the document fragment containing the styled markup.
         */
        getStyledFragment: function(){
            //normalize nodes
            RTEExt.rte.Utils.normalize(
                this._styledFragment,
                function(node){
                    return !this._isContainerNode(node)
                        && !this._isStylingContainerNode(node)
                        && !this._isIgnoredNode(node);
                }.bind(this),
                function(node){
                    var strip = false;

                    if(node.nodeType === 1
                        && !this._isContainerNode(node)
                        && !this._isStylingContainerNode(node)
                        && !this._isIgnoredNode(node)
                        && !node.firstChild){
                        strip = true;
                    } else if(node.nodeType === 3 && node.textContent.length === 0) {
                        strip = true;
                    }

                    return strip;
                }.bind(this)
            );

            return this._styledFragment;
        },

        /**
         * Builds the strip definition for stripping styles from descendant nodes.
         */
        _buildStripDef: function(){
            var curStyle,
                stripDef = {
                    'strip': {
                        'tagName': this._stylingTagName,
                        'styles': {}
                    },
                    'unwrap': {
                        'tagName': this._stylingTagName
                    }
                };

            for(curStyle in this._styles){
                if(this._styles.hasOwnProperty(curStyle)){
                    stripDef.strip.styles[curStyle] = /.*/;
                }
            }

            return stripDef;
        },

        /**
         * Determines if the provided node is a container node, meaning styling nodes must be placed within it.
         */
        _isContainerNode: function(node){
            return node.tagName && this._containerTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Determines if the provided node is a styling container node, meaning it serves as a container node but
         * may also be wrapped within existing styling tags (e.g. an <a/> tag wrapped in an <i/> tag or <i><a/></i>.
         */
        _isStylingContainerNode: function(node){
            return node.tagName && node.tagName.toLowerCase() !== this._stylingTagName
                && this._stylingContainerTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Determines if the provided node is an ignored node, meaning no special processing is performed on it.
         */
        _isIgnoredNode: function(node){
            return node.tagName && this._ignoredTags.includes(node.tagName.toLowerCase());
        },

        /**
         * Applies provided styles to the node.
         */
        _styleNode: function(node, styles){
            var curStyle;

            if(node && node.style){
                for(curStyle in styles){
                    if(styles.hasOwnProperty(curStyle)){
                        node.style[curStyle] = styles[curStyle];
                    }
                }
            }
        },

        /**
         * Checks if provided node is a styling node.  A styling node shares the stylingTagName and isn't an AEM
         * placeholder node.
         */
        _isStylingNode: function(node){
            //a styling node shares the same styling tag name
            var stylingNode = node.tagName && node.tagName.toLowerCase() === this.stylingTagName,
                i;

            //and doesn't contain an _rte attribute
            for(i = 0; stylingNode && i < node.attributes.length; i++){
                stylingNode = !node.attributes[i].name.startsWith('_rte');
            }

            return stylingNode;
        }
    });
})();
