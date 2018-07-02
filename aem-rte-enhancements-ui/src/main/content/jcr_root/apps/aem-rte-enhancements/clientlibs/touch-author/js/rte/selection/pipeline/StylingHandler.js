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

        _stylingQueue: null,

        _activeStylingNode: null,

        _withinSelection: null,

        _keepEmptyStylingTag: null,

        construct: function(stylingTagName, styles){
            this._stylingTagName = stylingTagName;
            this._styles = styles || {};
            this._originalTree = [];
            this._styledTree = [];
            this._stylingQueue = [];
            this._withinSelection = false;
            this._keepEmptyStylingTag = false;
        },

        setKeepEmptyStylingTag: function(keep){
            this._keepEmptyStylingTag = !!keep;
        },

        startSelection: function(chain){
            //move to next handler
            chain.next().startSelection(chain);
        },

        beginInnerNode: function(node, chain){
            const clonedNode = RTEExt.rte.Utils.cloneNode(node),
                isContainerNode = this._isContainer(node),
                containerTree = this._getContainerTree(),
                currentStyling = this._getAggregateStyling(clonedNode, containerTree);

            if(isContainerNode){
                //we are within selection and have encountered a container node.  close up to container node,
                //clear styling node and rebuild container tree (exclude styles
                //because we will be aggregating styles to the top level).
                this._closeContainer(chain);
            } else if(!this._activeStylingNode || this._isStylingNode(clonedNode)){
                //no styling node or a new styling node encountered.  need to rebuild styling structure.
                //close current styling container, replace styling node and rebuild container tree (exclude styles
                //because we will be aggregating styles to the top level).
                this._closeContainer(chain);

                //consider newly opened styling nodes within the selection
                this._withinSelection = true;

                //create styling node and rebuild container tree before tracking new node
                this._createStylingNode(currentStyling, chain);
                this._rebuildContainerTree(containerTree, false, chain);
            }

            //mark that we are within the selection if not already marked, this is done here so any existing
            //hierarchy is still considered outside the selection when closed.
            this._withinSelection = true;

            //track original and cloned node (if it isn't a styling node as we aggregated styles to top level)
            this._originalTree.push(node);
            if(!this._isStylingNode(clonedNode)){
                this._stripStyles(clonedNode);
                this._styledTree.push(clonedNode);
                this._addToQueue(clonedNode, true, chain);
            }

            if(isContainerNode){
                //create styling node within the container and rebuild tree.
                this._createStylingNode(currentStyling, chain);
                this._rebuildContainerTree(containerTree, false, chain);
            }
        },

        endInnerNode: function(node, chain){
            //mark that we are within the selection if not already marked
            this._withinSelection = true;

            //pop off original tree so node isn't considered when rebuilding container tree
            this._originalTree.pop();

            //close styling node if node is container node or styling node (as we have aggregated styles to
            //the top level).
            if(this._isContainer(node)){
                //close up to closest container
                this._closeContainer(chain);

                //pop off container before recreating styling nodes.
                this._addToQueue(this._styledTree.pop(), false, chain);

                //get container tree and styling for rebuild.
                const containerTree = this._getContainerTree(),
                    currentStyling = this._getAggregateStyling(null, containerTree);

                //create new styling node and recreate tree.
                this._createStylingNode(currentStyling, chain);
                this._rebuildContainerTree(containerTree, false, chain);
            } else if(this._styledTree[this._styledTree.length - 1] === this._activeStylingNode
                || this._isStylingNode(node)){
                //close styling container, no need to pop off styling tree as closing container will do just that.
                this._closeContainer(chain);

                //get container tree and styling for rebuild.
                const containerTree = this._getContainerTree(),
                    currentStyling = this._getAggregateStyling(null, containerTree);

                //create new styling node and recreate tree.
                this._createStylingNode(currentStyling, chain);
                this._rebuildContainerTree(containerTree, false, chain);
            } else {
                //normal end node
                this._addToQueue(this._styledTree.pop(), false, chain);
            }

            //flush queue if ending content node
            if(RTEExt.rte.Utils.isContentNode(node)
                && (node.nodeType !== 3 || node.textContent.length)){
                this._flushQueue();
            }
        },

        beginOuterNode: function(node, chain){
            const clonedNode = RTEExt.rte.Utils.cloneNode(node),
                isContainerNode = this._isContainer(node),
                containerTree = this._getContainerTree();

            if(isContainerNode){
                //we have encountered a container node.  close up to container node, so we can restructure nodes.
                this._closeContainer(chain);
            } else if(this._activeStylingNode){
                //close open styling node as we are not actively styling
                this._closeContainer(chain);

                //consider newly rebuilt hierarchy outside the selection
                this._withinSelection = false;

                //rebuild container tree before tracking new node
                this._clearStylingNode();
                this._rebuildContainerTree(containerTree, true, chain);
            }

            //mark that we are outside the selection if not already marked, this is done here so any new styling
            //hierarchy is still considered within the selection when closed.
            this._withinSelection = false;

            //track original and cloned node
            this._originalTree.push(node);
            this._styledTree.push(clonedNode);
            this._addToQueue(clonedNode, true, chain);

            if(isContainerNode){
                //clear any styling node and rebuild tree.
                this._clearStylingNode();
                this._rebuildContainerTree(containerTree, true, chain);
            }
        },

        endOuterNode: function(node, chain){
            //mark that we are outside the selection if not already marked
            this._withinSelection = false;

            //pop off original tree so node isn't considered when rebuilding container tree
            this._originalTree.pop();

            //close styling node if node is container node or styling node (as we have aggregated styles to
            //the top level).
            if(this._isContainer(node)){
                //close up to closest container
                this._closeContainer(chain);

                //pop off container before rebuilding.
                this._addToQueue(this._styledTree.pop(), false, chain);

                //clear any styling and rebuild tree.
                this._clearStylingNode();
                this._rebuildContainerTree(this._getContainerTree(), true, chain);
            } else if(this._activeStylingNode){
                //close styling container, no need to pop off styling tree as closing container will do just that.
                this._closeContainer(chain);

                //clear any styling and rebuild tree.
                this._clearStylingNode();
                this._rebuildContainerTree(this._getContainerTree(), true, chain);
            } else {
                //normal end node
                this._addToQueue(this._styledTree.pop(), false, chain);
            }

            //flush queue if ending content node
            if(RTEExt.rte.Utils.isContentNode(node)
                && (node.nodeType !== 3 || node.textContent.length)){
                this._flushQueue();
            }
        },

        endSelection: function(chain){
            //close open styling node as we are done styling
            if(this._activeStylingNode){
                this._closeContainer(chain);
                this._clearStylingNode();
            }

            //flush queue
            this._flushQueue();

            //move to next handler
            chain.next().endSelection(chain);
        },

        /**
         * Adds entry to styling queue for later processing.
         */
        _addToQueue: function(node, openingTag, chain){
            let callback;

            if(this._withinSelection){
                if(openingTag){
                    callback = chain.next().beginInnerNode.bind(chain.next(), node, chain);
                } else {
                    callback = chain.next().endInnerNode.bind(chain.next(), node, chain);
                }
            } else {
                if(openingTag){
                    callback = chain.next().beginOuterNode.bind(chain.next(), node, chain);
                } else {
                    callback = chain.next().endOuterNode.bind(chain.next(), node, chain);
                }
            }

            this._stylingQueue.push({
                node: node,
                openingTag: openingTag,
                withinSelection: this._withinSelection,
                callback: callback
            });
        },

        /**
         * flushes styling queue, will skip entries if determined that they are not essential or redundant empty nodes.
         */
        _flushQueue: function(){
            const localQueue = [];

            while(this._stylingQueue.length){
                //get next entry
                const tempQueueEntry = this._stylingQueue.shift();

                //don't process empty styling nodes that occur within the selection.
                if(!tempQueueEntry.withinSelection
                    || this._keepEmptyStylingTag
                    || !RTEExt.rte.Utils.canUnwrap(tempQueueEntry.node, this._stylingTagName)){
                    //add to local queue
                    localQueue.push(tempQueueEntry);

                    //if we encounter content, flush queue up to this point as we know we want to keep these records
                    if(RTEExt.rte.Utils.isContentNode(tempQueueEntry.node)
                        && (tempQueueEntry.node.nodeType !== 3 || tempQueueEntry.node.textContent.length)){
                        //write queue up to this point
                        while(localQueue.length){
                            localQueue.shift().callback();
                        }
                    } else if(!tempQueueEntry.openingTag){
                        //an entry is being closed, make sure it wasn't opened without containing content
                        const beginIndex = localQueue.findIndex(function(entry){
                            return entry.node === tempQueueEntry.node && entry.openingTag;
                        });

                        //if we are closing an empty node, just ignore it
                        if(beginIndex > -1){
                            localQueue.splice(beginIndex);
                        } else {
                            //we can write up to this point as this is valid
                            while(localQueue.length){
                                localQueue.shift().callback();
                            }
                        }
                    }
                }
            }

            //put any remaining entries back in the queue for later flushing
            while(localQueue.length){
                this._stylingQueue.push(localQueue.shift());
            }
        },

        /**
         * Closes the current container in the styling tree.  This is mainly used to reset a styling structure so a new
         * one can be created.
         */
        _closeContainer: function(chain){
            //move styled tree up to first container node.
            while(this._styledTree.length && !this._isContainer(this._styledTree[this._styledTree.length - 1])){
                this._addToQueue(this._styledTree.pop(), false, chain);
            }
        },

        /**
         * Rebuilds the current container in the styling tree.  This is mainly used to rebuild essential formatting
         * nodes when a new styling container is being created or styling is finished.
         */
        _rebuildContainerTree: function(tree, includeStyling, chain){
            const containerTree = tree.slice();

            //now recreate container tree, stripping styles and avoiding nested styling tags.
            while(containerTree.length){
                const tempNode = containerTree.shift();
                if(!this._isContainer(tempNode) && (includeStyling || !this._isStylingNode(tempNode))){
                    if(!includeStyling){
                        this._stripStyles(tempNode);
                    }
                    this._styledTree.push(tempNode);
                    this._addToQueue(tempNode, true, chain);
                }
            }
        },

        /**
         * Creates a new styling node.
         */
        _createStylingNode: function(additionalStyles, chain){
            //create styling node
            this._activeStylingNode = document.createElement(this._stylingTagName);
            if(additionalStyles){
                this._applyStyles(this._activeStylingNode, additionalStyles);
            }
            this._applyStyles(this._activeStylingNode);
            this._styledTree.push(this._activeStylingNode);
            this._addToQueue(this._activeStylingNode, true, chain);
        },

        /**
         * Clears any open styling node.
         */
        _clearStylingNode: function(){
            //clear active styling node
            this._activeStylingNode = null;
        },

        /**
         * Applies styles to a node.  If styles are provided, those are applied.  If no styles are provided, the global
         * styles are applied.
         */
        _applyStyles: function(node, styles){
            const activeStyles = styles || this._styles;

            if(node && node.style){
                for(let curStyle in activeStyles){
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
            if(node && node.style){
                for(let curStyle in this._styles){
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
            let stylingNode = node.tagName && node.tagName.toLowerCase() === this._stylingTagName;

            //and doesn't contain an _rte attribute
            for(let i = 0; stylingNode && i < node.attributes.length; i++){
                stylingNode = !node.attributes[i].name.startsWith('_rte');
            }

            return stylingNode;
        },

        /**
         * Aggregates styles from styling nodes contained in a hierarchy.  This is mainly used to flatten existing
         * styling nodes from the original tree.
         */
        _getAggregateStyling: function(node, tree){
            const styles = {};

            //get styles from active node
            if(node && this._isStylingNode(node)){
                for(let i = 0; i < node.style.length; i++){
                    styles[node.style[i]] = node.style[node.style[i]];
                }
            }

            //aggregate styles
            for(let i = tree.length - 1; i >= 0; i--){
                if(this._isStylingNode(tree[i])){
                    for(let j = 0; j < tree[i].style.length; j++){
                        if(!styles[tree[i].style[j]]){
                            styles[tree[i].style[j]] = tree[i].style[tree[i].style[j]];
                        }
                    }
                }
            }

            return styles;
        },

        /**
         * Gets the localized tree of the current container.
         */
        _getContainerTree: function(){
            const containerTree = [];

            //determine container hierarchy.
            let i = this._originalTree.length - 1;
            while(i >= 0
                && !RTEExt.rte.Utils.isContainerNode(this._originalTree[i])
                && !RTEExt.rte.Utils.isIgnoredNode(this._originalTree[i])){
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
                || RTEExt.rte.Utils.isStylingContainerNode(node, this._stylingTagName)
                || RTEExt.rte.Utils.isIgnoredNode(node);
        }
    });
})();
