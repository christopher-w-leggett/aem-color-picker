RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
(function(){
    "use strict";

    RTEExt.rte.MarkupStyler = new Class({
        toString: 'MarkupStyler',

        //define tags that we should not wrap within a span.
        nonWrappingTags: [
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
            'mark',
            'a',
            'ul',
            'ol',
            'li',
            'table',
            'caption',
            'tbody',
            'tr',
            'th',
            'td'
        ],

        stylingTagName: null,

        construct: function (stylingTagName) {
            this.stylingTagName = stylingTagName;
        },

        style: function(selection, styles, root){
            var actingRoot = RTEExt.rte.Utils.getCommonAncestor(selection, root),
                startDominantParents,
                startNode,
                endDominantParents,
                endNode,
                endTree = [],
                curStyle,
                stripDef;

            //determine start node
//            if(selection.startNode.nodeType !== 3 || selection.startOffset === 0){
//                startDominantParents = RTEExt.rte.Utils.getLeftDominantParents(
//                    selection.startNode, actingRoot
//                );
//                if(startDominantParents.length){
//                    startNode = startDominantParents.pop();
//                } else {
//                    startNode = selection.startNode;
//                }
//            } else {
                startNode = selection.startNode;
//            }

            //determine end node
//            if(selection.endNode.nodeType !== 3 || selection.endOffset === selection.endNode.length){
//                endDominantParents = RTEExt.rte.Utils.getRightDominantParents(
//                    selection.endNode, actingRoot
//                );
//                if(endDominantParents.length){
//                    endNode = endDominantParents.pop();
//                } else {
//                    endNode = selection.endNode;
//                }
//            } else {
                endNode = selection.endNode;
//            }

            //populate end tree so we don't style beyond this tree structure.
            endTree = RTEExt.rte.Utils.getAncestors(endNode, actingRoot);

            //determine strip definition TODO: change so method doesn't need regexp to strip tags.
            stripDef = {
                'strip': {
                    'tagName': new RegExp(this.stylingTagName, 'i'),
                    'styles': {}
                },
                'unwrap': {
                    'tagName': this.stylingTagName
                }
            };
            for(curStyle in styles){
                if(styles.hasOwnProperty(curStyle)){
                    stripDef.strip.styles[curStyle] = /.*/;
                }
            }

            //recurse across selection and style
            this.styleRange(
                startNode,
                selection.startOffset,
                endNode,
                selection.endOffset,
                styles,
                stripDef,
                endTree
            );

            //normalize nodes
            this.normalizeStyles(actingRoot, styles);
        },

        styleRange(startNode, startOffset, endNode, endOffset, styles, stripDef, endTree){
            var curNode,
                nextNode,
                stylingGroup;

            curNode = startNode;
            while(curNode){
                //get the group of nodes to style
                stylingGroup = this.getStylingGroup(curNode, endNode, endTree);

                //style group or move on.
                if(stylingGroup.length){
                    //get next node based off last node in styling group (just in case it is stripped out later)
                    nextNode = this.getNextInRange(stylingGroup[stylingGroup.length - 1], endNode, false);

                    //wrap and style the group of nodes.
                    this.styleNodes(stylingGroup, startNode, startOffset, endNode, endOffset, styles, stripDef);
                }else{
                    nextNode = this.getNextInRange(curNode, endNode, true);
                }

                //set next node
                curNode = nextNode;
            }
        },

        getStylingGroup: function(startNode, endNode, endTree){
            var group = [],
                curNode = startNode,
                nextNode;

            if(!endTree.includes(startNode)){
                while(curNode){
                    if(this.canWrap(curNode)){
                        group.push(curNode);

                        //get next sibling as long as we aren't the end node.
                        curNode = curNode !== endNode ? curNode.nextSibling : null;

                        //verify next sibling
                        if(curNode && endTree.includes(curNode)){
                            //we ran into the end nodes tree, don't wrap anymore siblings.
                            curNode = null;
                        }
                    }else{
                        //stop grouping as we can no longer wrap siblings
                        curNode = null;
                    }
                }
            }

            return group;
        },

        canWrap: function(node){
            var wrap = false;

            if(node.nodeType === 3){
                wrap = true;
            } else if(node.nodeType === 1 && !this.nonWrappingTags.includes(node.tagName.toLowerCase())){
                if(this.canWrapDescendants(node)){
                    wrap = true;
                }
            }

            return wrap;
        },

        canWrapDescendants: function(node){
            var wrapDescendants = true,
                i;

            for(i = 0; i < node.childNodes.length; i++){
                wrapDescendants = wrapDescendants && this.canWrap(node.childNodes[i]);
            }

            return wrapDescendants;
        },

        getNextInRange: function(node, endNode, deep){
            var curNode = node,
                nextNode = null;

            if(curNode !== endNode){
                if(deep && curNode.firstChild){
                    nextNode = curNode.firstChild;
                } else if(curNode.nextSibling){
                    nextNode = curNode.nextSibling;
                } else {
                    //find first sibling of parent structure.
                    while(!nextNode){
                        curNode = curNode.parentNode;
                        nextNode = curNode.nextSibling;
                    }
                }
            }

            return nextNode;
        },

        styleNodes: function(nodes, startNode, startOffset, endNode, endOffset, styles, stripDef){
            var firstNode = nodes[0],
                stylingContainer,
                startUnstyledText,
                styledText,
                endUnstyledText,
                clonedParent,
                curNode,
                nextNode,
                i;

            //create styling container and style appropriately.
            stylingContainer = document.createElement(this.stylingTagName);
            this.styleNode(stylingContainer, styles);

            //position styling container before first node in the group.
            firstNode.parentNode.insertBefore(stylingContainer, firstNode);

            //go through nodes and move them to our styling node.
            for(i = 0; i < nodes.length; i++){
                if(nodes[i] === startNode && nodes[i] === endNode && nodes[i].nodeType === 3 && (
                    startOffset || (endOffset && endOffset < nodes[i].textContent.length)
                )){
                    //node is both the start node and the end node and is partial text selection, move unstyled parts outside of styling container.
                    startUnstyledText = startOffset
                        ? document.createTextNode(nodes[i].textContent.substring(0, startOffset))
                        : null;
                    styledText = document.createTextNode(nodes[i].textContent.substring(
                        startOffset || 0, endOffset || nodes[i].textContent.length
                    ));
                    endUnstyledText = endOffset && endOffset < nodes[i].textContent.length
                        ? document.createTextNode(nodes[i].textContent.substring(endOffset))
                        : null;
                    if(startUnstyledText){
                        stylingContainer.parentNode.insertBefore(startUnstyledText, stylingContainer);
                    }
                    stylingContainer.appendChild(styledText);
                    if(endUnstyledText){
                        if(stylingContainer.nextSibling){
                            stylingContainer.parentNode.insertBefore(endUnstyledText, stylingContainer.nextSibling);
                        }else{
                            stylingContainer.parentNode.appendChild(endUnstyledText);
                        }
                    }
                    stylingContainer.parentNode.removeChild(nodes[i]);
                } else if(nodes[i] === startNode && nodes[i].nodeType === 3 && startOffset){
                    //if node is start node and is partial text selection, move unstyled part before the styling container and styled part at end of styling container.
                    startUnstyledText = document.createTextNode(nodes[i].textContent.substring(0, startOffset));
                    styledText = document.createTextNode(nodes[i].textContent.substring(startOffset));
                    stylingContainer.parentNode.insertBefore(startUnstyledText, stylingContainer);
                    stylingContainer.appendChild(styledText);
                    stylingContainer.parentNode.removeChild(nodes[i]);
                } else if(nodes[i] === endNode && nodes[i].nodeType === 3 && endOffset && endOffset < nodes[i].textContent.length){
                    //if node is end node and is partial text selection, move styled part at end of styling container and unstyled part after the styling container.
                    styledText = document.createTextNode(nodes[i].textContent.substring(0, endOffset));
                    endUnstyledText = document.createTextNode(nodes[i].textContent.substring(endOffset));
                    stylingContainer.appendChild(styledText);
                    if(stylingContainer.nextSibling){
                        stylingContainer.parentNode.insertBefore(endUnstyledText, stylingContainer.nextSibling);
                    }else{
                        stylingContainer.parentNode.appendChild(endUnstyledText);
                    }
                    stylingContainer.parentNode.removeChild(nodes[i]);
                } else {
                    //else move node at end of styling container.
                    stylingContainer.appendChild(nodes[i]);
                }
            }

            //if parent of styling container is itself a styling container, we need to split it.
            if(this.isStylingNode(stylingContainer.parentNode, styles)){
                if(stylingContainer.parentNode.firstChild === stylingContainer){
                    //simply move styling container before parent
                    stylingContainer.parentNode.parentNode.insertBefore(stylingContainer, stylingContainer.parentNode);
                } else {
                    //clone parent styling node and place cloned parent before the original parent
                    clonedParent = RTEExt.rte.Utils.cloneNode(stylingContainer.parentNode);
                    stylingContainer.parentNode.parentNode.insertBefore(clonedParent, stylingContainer.parentNode);

                    //move across children of original parent and move accordingly
                    curNode = stylingContainer.parentNode.firstChild;
                    while(curNode){
                        if(curNode !== stylingContainer){
                            //capture next node
                            nextNode = curNode.nextSibling;

                            //we are before styling container, so place them in the cloned parent
                            clonedParent.appendChild(curNode);

                            //set next node
                            curNode = nextNode;
                        } else {
                            //found styling container, move before original parent
                            stylingContainer.parentNode.parentNode.insertBefore(
                                stylingContainer, stylingContainer.parentNode
                            );

                            //end looping as we don't need to move content after styling container
                            curNode = null;
                        }
                    }
                }

                //remove original styled parent if it is now empty.
                if(!stylingContainer.nextSibling.childNodes.length){
                    stylingContainer.parentNode.removeChild(stylingContainer.nextSibling);
                }
            }

            //strip any descendant styling from our new stylingContainer
            RTEExt.rte.Utils.stripDescendantStyle(stylingContainer, stripDef);

            //it may be possible that our styles are actually being removed, if that is the case,
            //just unwrap our styling node
            if(RTEExt.rte.Utils.canUnwrap(stylingContainer, this.stylingTagName)){
                RTEExt.rte.Utils.unwrap(stylingContainer);
            }
        },

        /**
         * Applies provided styles to the node.
         */
        styleNode: function(node, styles){
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
         * Checks if provided node is a styling node that only contains at most the styles being applied.
         */
        isStylingNode: function(node, styles){
            //a styling node shares the same styling tag name
            var stylingNode = node.tagName && node.tagName.toLowerCase() === this.stylingTagName,
                i;

            //also only contains at most the style attribute
            stylingNode = stylingNode && (
                node.attributes.length === 0 || (
                    node.attributes.length === 1 && node.attributes[0].nodeName === 'style'
                )
            );

            //also only contains styles that are being modified.
            i = 0;
            while(stylingNode && i < node.style.length){
                stylingNode = stylingNode && styles.hasOwnProperty(node.style[i]);

                i++;
            }

            return stylingNode;
        },

        /**
         * Determines if two nodes share the same styles.
         */
        sharesStyles: function(node1, node2){
            var sameStyles = node1.style.length === node2.style.length,
                i;

            for(i = 0; i < node1.style.length && sameStyles; i++){
                sameStyles = node1.style[node1.style[i]] === node2.style[node1.style[i]];
            }

            return sameStyles;
        },

        /**
         * Normalizes tree structure by combining sibling nodes that share the same applicable styles.
         */
        normalizeStyles: function(node, styles){
            var curNode = node.firstChild,
                nextNode;

            //normalize styling nodes.
            while(curNode){
                //merge next sibling until we can't
                while(curNode.nextSibling
                    && this.isStylingNode(curNode, styles)
                    && this.isStylingNode(curNode.nextSibling, styles)
                    && this.sharesStyles(curNode, curNode.nextSibling)){
                    //merge siblings.
                    while(curNode.nextSibling.firstChild){
                        curNode.appendChild(curNode.nextSibling.firstChild);
                    }
                    curNode.parentNode.removeChild(curNode.nextSibling);
                }

                //move to next node, try to move down or across first
                nextNode = curNode.firstChild || curNode.nextSibling;
                //no next node, find first sibling of parent structure.  don't go beyond root node
                while(!nextNode && curNode !== node && curNode.parentNode !== node){
                    curNode = curNode.parentNode;
                    nextNode = curNode.nextSibling;
                }
                curNode = nextNode;
            }

            //finally normalize text nodes
            node.normalize();
        }
    });
})();
