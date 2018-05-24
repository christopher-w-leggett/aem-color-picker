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
            var actingRoot,
                curStyle,
                stripDef,
                styledFragment,
                startNode = selection.startNode,
                startOffset = startNode.nodeType === 3 ? selection.startOffset : null,
                startTree,
                endNode = selection.endNode,
                endOffset = endNode.nodeType === 3 ? selection.endOffset : null,
                endTree,
                readPointer,
                writePointer,
                curClone,
                curStylingNode,
                tempNode,
                tempTree,
                trackTree = false,
                startUnstyledText,
                styledText,
                endUnstyledText,
                foundStartNode = false,
                foundEndNode = false,
                i;

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

            if(startNode && endNode){
                //determine acting root of start/end nodes.  This needs to be closest non-wrapping ancestor.
                actingRoot = this._getActingRoot(selection, root);

                //populate start/end trees
                startTree = RTEExt.rte.Utils.getAncestors(startNode, actingRoot);
                endTree = RTEExt.rte.Utils.getAncestors(endNode, actingRoot);

                //create document fragment to hold new content
                styledFragment = document.createDocumentFragment();
                writePointer = styledFragment;
                readPointer = actingRoot.firstChild;

                //copy and style content to document fragment.
                while(readPointer){
                    curClone = RTEExt.rte.Utils.cloneNode(readPointer);
                    if(curClone){
                        if(!foundStartNode && !foundEndNode && readPointer === startNode) {
                            foundStartNode = true;
                            if(startNode === endNode){
                                foundEndNode = true;
                            }

                            //split text appropriately
                            startUnstyledText = null;
                            styledText = null;
                            endUnstyledText = null;
                            if(startNode === endNode && (startOffset || (endOffset && endOffset < curClone.textContent.length))){
                                //start/end are the same, so we need to split the single node.
                                startUnstyledText = startOffset
                                    ? document.createTextNode(curClone.textContent.substring(0, startOffset))
                                    : null;
                                styledText = document.createTextNode(curClone.textContent.substring(
                                    startOffset || 0, endOffset || curClone.textContent.length
                                ));
                                endUnstyledText = endOffset && endOffset < curClone.textContent.length
                                    ? document.createTextNode(curClone.textContent.substring(endOffset))
                                    : null;
                            } else if(startOffset) {
                                //there is a start offset, so we need to split the start node.
                                startUnstyledText = startOffset
                                    ? document.createTextNode(curClone.textContent.substring(0, startOffset))
                                    : null;
                                styledText = document.createTextNode(curClone.textContent.substring(
                                    startOffset || 0, endOffset || curClone.textContent.length
                                ));
                            }

                            //if the beginning portion of our start node is unstyled, just append now
                            if(startUnstyledText){
                                writePointer.appendChild(startUnstyledText);
                            }

                            //we need to move our write pointer up to first non-wrapping node (keep track of tree)
                            tempTree = [];
                            while(writePointer.nodeType !== 11 && !this._isNonWrappingNode(writePointer) && writePointer !== actingRoot){
                                //clone and track tree
                                tempNode = RTEExt.rte.Utils.cloneNode(writePointer);
                                tempTree.push(tempNode);

                                //strip empty nodes
                                tempNode = writePointer.parentNode;
                                if(!writePointer.childNodes.length){
                                    writePointer.parentNode.removeChild(writePointer);
                                }

                                //reposition write pointer
                                writePointer = tempNode;
                            }

                            //set or create styling node
                            if(tempTree.length && this.isStylingNode(tempTree[tempTree.length - 1])){
                                curStylingNode = tempTree[tempTree.length - 1];
                                this.styleNode(curStylingNode, styles);
                            } else {
                                //create styling node and append to write pointer,
                                //then move writePointer to styling node.
                                curStylingNode = document.createElement(this.stylingTagName);
                                this.styleNode(curStylingNode, styles);
                                writePointer.appendChild(curStylingNode);
                                writePointer = curStylingNode;
                            }

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                writePointer.appendChild(tempTree[i]);
                                writePointer = tempTree[i];
                            }

                            //append styled start node
                            writePointer.appendChild(styledText || curClone);

                            //if we also encountered our end node, handle the end portion now.
                            if(foundEndNode){
                                //close open styling node by move our write pointer above the current styling node
                                //and setting current styling node to null.
                                while(writePointer !== curStylingNode){
                                    writePointer = writePointer.parentNode;
                                }
                                writePointer = writePointer.parentNode;
                                RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                                if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                    RTEExt.rte.Utils.unwrap(curStylingNode);
                                }
                                curStylingNode = null;

                                //we need to determine the portion of the end tree to recreate for the next node.
                                trackTree = endUnstyledText || readPointer.firstChild || readPointer.nextSibling;
                                tempTree = [];
                                tempNode = readPointer.parentNode;
                                while(!this._isNonWrappingNode(tempNode) && tempNode !== actingRoot){
                                    if(trackTree){
                                        tempTree.push(tempNode);
                                    }
                                    trackTree = trackTree || tempNode.nextSibling;
                                    tempNode = tempNode.parentNode;
                                }

                                //now recreate hierarchy
                                for(i = tempTree.length - 1; i >=0; i--){
                                    tempNode = RTEExt.rte.Utils.cloneNode(tempTree[i]);
                                    writePointer.appendChild(tempNode);
                                    writePointer = tempNode;
                                }

                                if(endUnstyledText){
                                    writePointer.appendChild(endUnstyledText);
                                }
                            }
                        } else if(foundStartNode && !foundEndNode && readPointer !== endNode){
                            //if readPointer is a non wrapping tag
                            if(this._isNonWrappingNode(readPointer)){
                                //close any open styling node by move our write pointer above the current styling node
                                //and setting current styling node to null.
                                if(curStylingNode){
                                    while(writePointer !== curStylingNode){
                                        writePointer = writePointer.parentNode;
                                    }
                                    writePointer = writePointer.parentNode;
                                    RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                                    if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                        RTEExt.rte.Utils.unwrap(curStylingNode);
                                    }
                                    curStylingNode = null;
                                }
                            } else if(!curStylingNode){
                                if(this.isStylingNode(curClone)){
                                    curStylingNode = curClone;
                                    this.styleNode(curStylingNode, styles);
                                } else {
                                    //open new styling node
                                    curStylingNode = document.createElement(this.stylingTagName);
                                    this.styleNode(curStylingNode, styles);
                                    writePointer.appendChild(curStylingNode);
                                    writePointer = curStylingNode;
                                }
                            }

                            //append cloned node
                            writePointer.appendChild(curClone);
                        } else if(foundStartNode && !foundEndNode && readPointer === endNode){
                            //split end node appropriately
                            styledText = null;
                            endUnstyledText = null;
                            if(endOffset && endOffset < curClone.textContent.length) {
                                styledText = document.createTextNode(curClone.textContent.substring(
                                    0, endOffset
                                ));
                                endUnstyledText = document.createTextNode(curClone.textContent.substring(endOffset));
                            }

                            //open a new styling node if we don't have one
                            if(!curStylingNode){
                                curStylingNode = document.createElement(this.stylingTagName);
                                this.styleNode(curStylingNode, styles);
                                writePointer.appendChild(curStylingNode);
                                writePointer = curStylingNode;
                            }

                            //append styled end node
                            writePointer.appendChild(styledText || curClone);

                            //close open styling node by move our write pointer above the current styling node
                            //and setting current styling node to null.
                            while(writePointer !== curStylingNode){
                                writePointer = writePointer.parentNode;
                            }
                            writePointer = writePointer.parentNode;
                            RTEExt.rte.Utils.stripDescendantStyle(curStylingNode, stripDef);
                            if(RTEExt.rte.Utils.canUnwrap(curStylingNode, this.stylingTagName)){
                                RTEExt.rte.Utils.unwrap(curStylingNode);
                            }
                            curStylingNode = null;

                            //we need to determine the portion of the end tree to recreate for the next node.
                            trackTree = endUnstyledText || readPointer.firstChild || readPointer.nextSibling;
                            tempTree = [];
                            tempNode = readPointer.parentNode;
                            while(!this._isNonWrappingNode(tempNode) && tempNode !== actingRoot){
                                if(trackTree){
                                    tempTree.push(tempNode);
                                }
                                trackTree = trackTree || tempNode.nextSibling;
                                tempNode = tempNode.parentNode;
                            }

                            //now recreate hierarchy
                            for(i = tempTree.length - 1; i >=0; i--){
                                tempNode = RTEExt.rte.Utils.cloneNode(tempTree[i]);
                                writePointer.appendChild(tempNode);
                                writePointer = tempNode;
                            }

                            if(endUnstyledText){
                                writePointer.appendChild(endUnstyledText);
                            }
                        } else {
                            //we are before start node or after end node, just append our clone.
                            writePointer.appendChild(curClone);
                        }

                        //move to next node.
                        if(readPointer.firstChild){
                            //when moving down a tree, readPointer moves down and writePointer moves to cloned node.
                            readPointer = readPointer.firstChild;
                            writePointer = curClone;
                        } else if(readPointer.nextSibling){
                            //when moving across a tree, readPointer moves across and writePointer stays the same.
                            readPointer = readPointer.nextSibling;
                        } else {
                            //when moving up a tree, readPointer moves to first parents next sibling and
                            //writePointer follows the same pattern
                            while(!readPointer.nextSibling && readPointer !== actingRoot){
                                readPointer = readPointer.parentNode;
                                if(writePointer.parentNode){
                                    //clear styling node if we are moving out of it
                                    if(curStylingNode && curStylingNode === writePointer){
                                        curStylingNode = null;
                                    }

                                    writePointer = writePointer.parentNode;
                                }
                            }

                            //set readPointer to correct location
                            if(readPointer === actingRoot){
                                //if we are at root, stop processing
                                readPointer = null;
                            } else {
                                //if we are not at root, we found a nextSibling, so point to it.
                                readPointer = readPointer.nextSibling;
                            }
                        }
                    } else {
                        //move across or up content if we are unable to clone.
                        if(readPointer.nextSibling){
                            //when moving across a tree, readPointer moves across and writePointer stays the same.
                            readPointer = readPointer.nextSibling;
                        } else {
                            //when moving up a tree, readPointer moves to first parents next sibling and
                            //writePointer follows the same pattern
                            while(!readPointer.nextSibling && readPointer !== actingRoot){
                                readPointer = readPointer.parentNode;
                                if(writePointer.parentNode){
                                    //clear styling node if we are moving out of it
                                    if(curStylingNode && curStylingNode === writePointer){
                                        curStylingNode = null;
                                    }

                                    writePointer = writePointer.parentNode;
                                }
                            }

                            //set readPointer to correct location
                            if(readPointer === actingRoot){
                                //if we are at root, stop processing
                                readPointer = null;
                            } else {
                                //if we are not at root, we found a nextSibling, so point to it.
                                readPointer = readPointer.nextSibling;
                            }
                        }
                    }
                }

                //normalize nodes
                this.normalize(styledFragment);

                //remove all children of acting root
                while(actingRoot.firstChild){
                    actingRoot.removeChild(actingRoot.firstChild);
                }

                //append document fragment to acting root
                actingRoot.appendChild(styledFragment);
            }

            //set writePointer to document fragment.
            //set readPointer to firstChild of root.
            //iterate across all nodes (deep) in acting root.
                //if we haven't encountered the start node and readPointer isn't the startNode or isn't in start nodes hierarchy, just clone to writePointer.
                    //move readPointer to next sibling or parents next sibling.
                //else if readPointer is in start nodes hierarchy, clone the readPointer and append to writePointer.
                    //move readPointer to firstChild, nextSibling or parents next sibling.
                    //move writePointer to cloned node (if readPointer goes to firstChild) or the writePointers parent (if readPointer goes to parent sibling).
                //else if node is start node
                    //split if need, moving unformatted portion into writePointer.
                    //move writePointer up to first ancestor of itself that is a non-wrapping ancestor.
                    //create formatting node and append to writePointer, set writePointer to formatting node.
                    //move formatted portion of start node into writePointer (formatting section).
                    //move readPointer to firstChild, nextSibling or parents next sibling.
                    //move writePointer to firstChild, or the writePointers parent (if readPointer goes to parent sibling).
                //else if we encountered the start node, haven't encountered the endNode and readPointer isn't in endHierarchy and can be wrapped.
                    //append to writePointer.
                    //move readPointer to firstChild, nextSibling or parents next sibling.
                    //move writePointer to firstChild, or the writePointers parent (if readPointer goes to parent sibling).
                //else if we encountered the start node, haven't encountered the endNode and readPointer isn't in endHierarchy and readPointer can't be wrapped.
                    //move writePointer up to first ancestor of itself that is a non-wrapping ancestor.
                    //clone readPointer and append to writePointer.
                    //move readPointer to firstChild, nextSibling or parents next sibling.
                    //move writePointer to cloned node (if readPointer goes to firstChild) or the writePointers parent (if readPointer goes to parent sibling).

            //remove all children of acting root.
            //append document fragment to acting root.

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
//                startNode = selection.startNode;
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
//                endNode = selection.endNode;
//            }

            //populate end tree so we don't style beyond this tree structure.
//            endTree = RTEExt.rte.Utils.getAncestors(endNode, actingRoot);
//
//            //determine strip definition TODO: change so method doesn't need regexp to strip tags.
//            stripDef = {
//                'strip': {
//                    'tagName': new RegExp(this.stylingTagName, 'i'),
//                    'styles': {}
//                },
//                'unwrap': {
//                    'tagName': this.stylingTagName
//                }
//            };
//            for(curStyle in styles){
//                if(styles.hasOwnProperty(curStyle)){
//                    stripDef.strip.styles[curStyle] = /.*/;
//                }
//            }
//
//            //recurse across selection and style
//            this.styleRange(
//                startNode,
//                selection.startOffset,
//                endNode,
//                selection.endOffset,
//                styles,
//                stripDef,
//                endTree
//            );
        },

        _getActingRoot: function(selection, root){
            var startNodeAncestors = RTEExt.rte.Utils.getAncestors(selection.startNode, root),
                endNodeAncestors = RTEExt.rte.Utils.getAncestors(selection.endNode, root),
                activeRoot = null,
                startIndex = 0,
                endIndex = 0;

            while(activeRoot === null && startIndex < startNodeAncestors.length){
                if(startNodeAncestors[startIndex].tagName
                    && this._isNonWrappingNode(startNodeAncestors[startIndex])
                    && startNodeAncestors[startIndex] === endNodeAncestors[endIndex]){
                    activeRoot = startNodeAncestors[startIndex];
                }

                //move to next set of checks
                if(endIndex < endNodeAncestors.length - 1){
                    endIndex++;
                } else {
                    startIndex++;
                    endIndex = 0;
                }
            }

            return activeRoot;
        },

        _isNonWrappingNode: function(node){
            return node.tagName && this.nonWrappingTags.includes(node.tagName.toLowerCase());
        },

        //TODO: Review below.

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
            } else if(node.nodeType === 1 && !this._isNonWrappingNode(node)){
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

//        styleNodes: function(nodes, startNode, startOffset, endNode, endOffset, styles, stripDef){
//            var firstNode = nodes[0],
//                stylingContainer,
//                startUnstyledText,
//                styledText,
//                endUnstyledText,
//                clonedParent,
//                curNode,
//                nextNode,
//                i;
//
//            //look up ancestors of first node for either a non wrapping element or a styling element, whatever comes first.
//
//            //clone and place clone before original
//            //move all nodes up to start node hierarchy into clone
//            //for start node hierarchy, clone nodes
//
//
//
//
//
//
//
//
//
//            //create styling container and style appropriately.
//            stylingContainer = document.createElement(this.stylingTagName);
//            this.styleNode(stylingContainer, styles);
//
//            //position styling container before first node in the group.
//            firstNode.parentNode.insertBefore(stylingContainer, firstNode);
//
//            //go through nodes and move them to our styling node.
//            for(i = 0; i < nodes.length; i++){
//                if(nodes[i] === startNode && nodes[i] === endNode && nodes[i].nodeType === 3 && (
//                    startOffset || (endOffset && endOffset < nodes[i].textContent.length)
//                )){
//                    //node is both the start node and the end node and is partial text selection, move unstyled parts outside of styling container.
//                    startUnstyledText = startOffset
//                        ? document.createTextNode(nodes[i].textContent.substring(0, startOffset))
//                        : null;
//                    styledText = document.createTextNode(nodes[i].textContent.substring(
//                        startOffset || 0, endOffset || nodes[i].textContent.length
//                    ));
//                    endUnstyledText = endOffset && endOffset < nodes[i].textContent.length
//                        ? document.createTextNode(nodes[i].textContent.substring(endOffset))
//                        : null;
//                    if(startUnstyledText){
//                        stylingContainer.parentNode.insertBefore(startUnstyledText, stylingContainer);
//                    }
//                    stylingContainer.appendChild(styledText);
//                    if(endUnstyledText){
//                        if(stylingContainer.nextSibling){
//                            stylingContainer.parentNode.insertBefore(endUnstyledText, stylingContainer.nextSibling);
//                        }else{
//                            stylingContainer.parentNode.appendChild(endUnstyledText);
//                        }
//                    }
//                    stylingContainer.parentNode.removeChild(nodes[i]);
//                } else if(nodes[i] === startNode && nodes[i].nodeType === 3 && startOffset){
//                    //if node is start node and is partial text selection, move unstyled part before the styling container and styled part at end of styling container.
//                    startUnstyledText = document.createTextNode(nodes[i].textContent.substring(0, startOffset));
//                    styledText = document.createTextNode(nodes[i].textContent.substring(startOffset));
//                    stylingContainer.parentNode.insertBefore(startUnstyledText, stylingContainer);
//                    stylingContainer.appendChild(styledText);
//                    stylingContainer.parentNode.removeChild(nodes[i]);
//                } else if(nodes[i] === endNode && nodes[i].nodeType === 3 && endOffset && endOffset < nodes[i].textContent.length){
//                    //if node is end node and is partial text selection, move styled part at end of styling container and unstyled part after the styling container.
//                    styledText = document.createTextNode(nodes[i].textContent.substring(0, endOffset));
//                    endUnstyledText = document.createTextNode(nodes[i].textContent.substring(endOffset));
//                    stylingContainer.appendChild(styledText);
//                    if(stylingContainer.nextSibling){
//                        stylingContainer.parentNode.insertBefore(endUnstyledText, stylingContainer.nextSibling);
//                    }else{
//                        stylingContainer.parentNode.appendChild(endUnstyledText);
//                    }
//                    stylingContainer.parentNode.removeChild(nodes[i]);
//                } else {
//                    //else move node at end of styling container.
//                    stylingContainer.appendChild(nodes[i]);
//                }
//            }
//
//            //if parent of styling container is itself a styling container, we need to split it.
//            if(this.isStylingNode(stylingContainer.parentNode, styles)){
//                if(stylingContainer.parentNode.firstChild === stylingContainer){
//                    //simply move styling container before parent
//                    stylingContainer.parentNode.parentNode.insertBefore(stylingContainer, stylingContainer.parentNode);
//                } else {
//                    //clone parent styling node and place cloned parent before the original parent
//                    clonedParent = RTEExt.rte.Utils.cloneNode(stylingContainer.parentNode);
//                    stylingContainer.parentNode.parentNode.insertBefore(clonedParent, stylingContainer.parentNode);
//
//                    //move across children of original parent and move accordingly
//                    curNode = stylingContainer.parentNode.firstChild;
//                    while(curNode){
//                        if(curNode !== stylingContainer){
//                            //capture next node
//                            nextNode = curNode.nextSibling;
//
//                            //we are before styling container, so place them in the cloned parent
//                            clonedParent.appendChild(curNode);
//
//                            //set next node
//                            curNode = nextNode;
//                        } else {
//                            //found styling container, move before original parent
//                            stylingContainer.parentNode.parentNode.insertBefore(
//                                stylingContainer, stylingContainer.parentNode
//                            );
//
//                            //end looping as we don't need to move content after styling container
//                            curNode = null;
//                        }
//                    }
//                }
//
//                //remove original styled parent if it is now empty.
//                if(!stylingContainer.nextSibling.childNodes.length){
//                    stylingContainer.parentNode.removeChild(stylingContainer.nextSibling);
//                }
//            }
//
//            //strip any descendant styling from our new stylingContainer
//            RTEExt.rte.Utils.stripDescendantStyle(stylingContainer, stripDef);
//
//            //it may be possible that our styles are actually being removed, if that is the case,
//            //just unwrap our styling node
//            if(RTEExt.rte.Utils.canUnwrap(stylingContainer, this.stylingTagName)){
//                RTEExt.rte.Utils.unwrap(stylingContainer);
//            }
//        },

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
         * Checks if provided node is a styling node.
         */
        isStylingNode: function(node){
            //a styling node shares the same styling tag name
            var stylingNode = node.tagName && node.tagName.toLowerCase() === this.stylingTagName,
                i;

            //and doesn't contain an _rte attribute
            for(i = 0; i < node.attributes.length && stylingNode; i++){
                stylingNode = !node.attributes[i].name.startsWith('_rte');
            }

            return stylingNode;
        },

        /**
         * Determines if two nodes are the same.
         */
        isEqual: function(node1, node2){
            var equal = false,
                node2Attributes = {},
                node2ClassNames = {},
                i;

            //only compare elements.
            if(node1.nodeType === 1 && node2.nodeType === 1){
                //compare tag name
                equal = node1.tagName === node2.tagName;

                //compare attribute length
                equal = equal && node1.attributes.length === node2.attributes.length;

                //compare style length
                equal = equal && node1.style.length === node2.style.length;

                //compare class length
                equal = equal && node1.classList.length === node2.classList.length;

                //compare specific attributes
                if(equal){
                    for(i = 0; i < node2.attributes.length; i++){
                        node2Attributes[node2.attributes[i].name] = node2.attributes[i].value;
                    }
                    for(i = 0; i < node1.attributes.length && equal; i++){
                        equal = node2Attributes.hasOwnProperty(node1.attributes[i].name)
                            && node1.attributes[i].value === node2Attributes[node1.attributes[i].name];
                    }
                }

                //compare specific styles
                for(i = 0; i < node1.style.length && equal; i++){
                    equal = node1.style[node1.style[i]] === node2.style[node1.style[i]];
                }

                //compare specific classes
                if(equal){
                    for(i = 0; i < node2.classList.length; i++){
                        node2ClassNames[node2.classList[i]] = true;
                    }
                    for(i = 0; i < node1.classList.length && equal; i++){
                        equal = node2ClassNames.hasOwnProperty(node1.classList[i]);
                    }
                }
            }

            return equal;
        },

        /**
         * Normalizes tree structure by combining sibling nodes that share the same applicable styles.
         */
        normalize: function(node){
            var curNode = node.firstChild,
                nextNode;

            //normalize styling nodes.
            while(curNode){
                //merge next sibling until we can't
                while(curNode.nextSibling
                    && !this._isNonWrappingNode(curNode)
                    && !this._isNonWrappingNode(curNode.nextSibling)
                    && this.isEqual(curNode, curNode.nextSibling)){
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
