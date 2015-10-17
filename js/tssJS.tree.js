

/* 树控件 */
;(function($, factory) {

    $.Tree = factory($);

    var TreeCache = {};

    $.T = function(id, data, _default) {
        var tree = TreeCache[id];
        if( tree == null && data == null ) return tree;

        if( tree == null || data ) {
            tree = new $.Tree($1(id), data);
            TreeCache[id] = tree;   

            _default = $.Query.get("_default") || _default;
            if(_default) {
                tree.searchNode( decodeURI(_default) );
                if(tree.getActiveTreeNode()) {
                    setTimeout(function() {
                        var callback = tree.onTreeNodeDoubleClick || tree.onTreeNodeActived;
                        callback && callback();
                    }, 100); 
                }
            }
        }   
        
        return tree;
    };

    $.fn.extend({
        tree: function(data, _default) {
            if(this.length > 0) {
               return $.T(this[0].id, data, _default);
            }
        }
    });

})(tssJS, function($) {

    'use strict';

    var
        _TREE_TYPE = "treeType",
        _TREE_TYPE_SINGLE = "single",
        _TREE_TYPE_MULTI  = "multi",

        _TREE_NODE_MOVEABLE = "moveable",      // 是否可以移动树节点，默认false
        _TREE_NODE_CHECK_SELF = "selectSelf",  // 选中节点时只改变自己的选择状态，与父、子节点无关

    Tree = function(el, data) {
        /*  自定义事件 */
        var eventTreeReady       = new $.EventFirer(this, "onLoad"),
            eventTreeChange      = new $.EventFirer(this, "onChange"),
            eventNodeActived     = new $.EventFirer(this, "onTreeNodeActived"), 
            eventNodeDoubleClick = new $.EventFirer(this, "onTreeNodeDoubleClick"),
            eventNodeRightClick  = new $.EventFirer(this, "onTreeNodeRightClick"),
            eventNodeMoved       = new $.EventFirer(this, "onTreeNodeMoved"),
            eventNodeChecked     = new $.EventFirer(this, "onTreeNodeChecked");

        this.el = el;
        this.treeType  = el.getAttribute(_TREE_TYPE) || _TREE_TYPE_SINGLE;
        this.moveable  = el.getAttribute(_TREE_NODE_MOVEABLE) == "true";
        this.checkSelf = el.getAttribute(_TREE_NODE_CHECK_SELF) == "true";

        this.rootList = [];

        this.init = function() {
            if(data.nodeType) {
                loadXML(data);
            } else {
                loadJson(data);
            }

            $(this.el).html("");

            var ul = $.createElement("ul");
            this.rootList.each(function(i, root){
                var li = root.toHTMLTree();
                ul.appendChild(li);
            });
            this.el.appendChild(ul);

            eventTreeReady.fire(); // 触发载入完成事件
        }

        // 定义Tree私有方法
        var tThis = this;
        var loadXML = function(node) {
            var xmlNodes = node.querySelectorAll("treeNode");
            var parents = {};
            $.each(xmlNodes, function(i, xmlNode) {
                var nodeAttrs = {};
                $.each(xmlNode.attributes, function(j, attr) {
                    nodeAttrs[attr.nodeName] = attr.value;
                });

                var parentId = xmlNode.parentNode.getAttribute(_TREE_NODE_ID);
                var parent = parents[parentId];
                var treeNode = new TreeNode(nodeAttrs, parent);

                if(parent == null) {
                    tThis.rootList.push(treeNode); // 可能存在多个根节点
                }   
                parents[treeNode.id] = treeNode;
            });
        };

        // 借助于stack. [{id:1, name:node1, children:[ {id:3, name:node3, children:[......]} ], xx:xx}, {id:2......}]
        // array.unshift(x), 先进先出；array.push(x), 后进先出
        var loadJson = function(data) {
            var stack = [];
            var parents = {};

            data.each(function(i, nodeAttrs) {
                stack.unshift(nodeAttrs);
            });

            var current;
            while(stack.length > 0) {
                current = stack.pop();

                var treeNode = new TreeNode(current, current.parent); 
                if(current.parent == null) {
                    tThis.rootList.push(treeNode);
                }

                (current.children || []).each(function(i, child) {
                    child.parent = treeNode;
                    stack.unshift(child);
                });
            }
        };

        // 树控件上禁用默认右键和选中文本（默认双击会选中节点文本）
        this.el.oncontextmenu = this.el.onselectstart = function(_event) {
            $.Event.cancel(_event || window.event);
        }       

        /********************************************* 定义树节点TreeNode start *********************************************/
        var 
            _TREE_NODE = "treeNode",
            _TREE_NODE_ID = "id",
            _TREE_NODE_NAME = "name",
            _TREE_ROOT_NODE_ID = "_root",  /* “全部”节点的ID值  */
            _TREE_NODE_STATE = "disabled",       // 停用、启用
            
            /* 
             * 树节点的选择状态：没选(UN_CHECKED)、半选(HALF_CHECKED)、全选(CHECKED)  0/1/2/ 
             * 禁选(CHECKED_DISABLED)状态下，也分没选、半选、全选
             */
            _TREE_NODE_CHECK_STATE = "checkState",  

        clickSwich = function(node) {
            node.opened = !node.opened;

            var styles = ["node_close", "node_open"],
                index = node.opened ? 0 : 1;

            $(node.li.switchIcon).removeClass(styles[index]).addClass(styles[++index % 2]);

            if(node.li.ul) {
                if(node.opened) {
                    $(node.li.ul).removeClass("hidden");
                    var parent = node;
                    while(parent = parent.parent) {
                        $(parent.li.ul).removeClass("hidden");
                        $(parent.li.switchIcon).removeClass(styles[0]).addClass(styles[1]);
                    }
                } 
                else {
                    $(node.li.ul).addClass("hidden");
                }
            }
        },

        /* 根据现有状态改成下一个选择状态，0-->2,  1|2-->0, 同时改变子节点及父节点的check状态 */
        checkNode = function(node, excludeDisabledNode) {
            if( !node.isEnable() && (excludeDisabledNode || true) ) {
                return;
            }

            var oldState = node.checkState;
            switch(oldState) {
                case 0:
                    node.checkState = 2;

                    var parent = node;
                    while(parent = parent.parent) {
                        var oldState = parent.checkState;
                        parent.refreshCheckState(Math.max(oldState, 1));
                    }

                    if(!tThis.checkSelf && node.li.ul) {
                        $("li", node.li.ul).each(function(i, childLi){
                            childLi.node.refreshCheckState(2);
                        });
                    }
                    break;
                case 1:
                case 2:
                    node.checkState = 0;

                    if(!tThis.checkSelf) {
                        $("li", node.li).each(function(i, childLi){
                            childLi.node.refreshCheckState(0);
                        });
 
                        var parent = node;
                        while(parent = parent.parent) {
                            calculateParentState(parent);
                        }
                    }

                    break;
            }

            node.refreshCheckState();
        },

        // 计算父亲节点的checkSate。判断兄弟节点还有没有选中状态的，有则所有父节点一律为半选，无则一律不选
        calculateParentState = function(parent) {
            if(parent == null) return;

            var hasCheckedChilds = false;
            parent.children.each(function(i, child){
                if(child.checkState > 0) {
                    hasCheckedChilds = true;
                }
            });

            parent.refreshCheckState( hasCheckedChilds ? 1 : 0 );
        },

        TreeNode = function(attrs, parent) {            
            this.id   = attrs[_TREE_NODE_ID];
            this.name = attrs[_TREE_NODE_NAME];

            this.opened = (attrs._open == "true");
            this.disabled = attrs[_TREE_NODE_STATE] || "0";  // 状态： 停用/启用  1/0
            this.checkState = parseInt(attrs[_TREE_NODE_CHECK_STATE] || "0"); /* 节点的选择状态 */

            this.attrs = attrs;

            // 维护成可双向树查找
            this.children = [];

            this.parent = parent;
            if(this.parent) {
                this.level = this.parent.level + 1;
                this.parent.children.push(this);
            } else {
                this.level = 1;
                this.opened = true; // 默认打开第一层
            }               

            this.toHTMLTree = function() {
                var stack = [];
                stack.push(this);

                var current, currentEl, rootEl, ul;
                while(stack.length > 0) {
                    current = stack.pop();
                    var currentEl = current.toHTMLEl();
                    if(rootEl == null) {
                        rootEl = currentEl;
                    }
                    else {
                        ul = rootEl.querySelector("ul[pID ='" + current.parent.id + "']");
                        ul.pNode = current;
                        ul.insertBefore(currentEl, ul.firstChild);
                    }

                    current.children.each(function(i, child) {
                        stack.push(child);
                    });
                }

                return rootEl;
            };
        };

        TreeNode.prototype = {
            toHTMLEl: function() {
                var li = $.createElement("li");
                li.setAttribute("nodeID", this.id);
                li.draggable = tThis.moveable;
                li.node = this;
                this.li = li;

                // 节点打开、关闭开关
                li.switchIcon = $.createElement("span", "switch");
                li.appendChild(li.switchIcon);

                // checkbox
                li.checkbox = $.createElement("span", "checkbox");
                li.appendChild(li.checkbox);

                // 自定义图标
                var selfIcon = $.createElement("div", "selfIcon");
                li.appendChild(selfIcon);
                li.selfIcon = $(selfIcon);

                if(this.attrs["icon"]) {
                    li.selfIcon.css("backgroundImage", "url(" + this.attrs["icon"] + ")");
                    li.selfIcon.addClass = function(cn) {
                        return this; // 如果已经自定义了图标，则忽略后面的folder、leaf等图标设置
                    }
                }

                // 节点名称
                li.a = $.createElement("a");
                $(li.a).html(this.name).title(this.name);
                li.appendChild(li.a);
                if( !this.isEnable() ) {
                    this.disable();
                }

                // 每个节点都可能成为父节点
                li.ul = $.createElement("ul");
                li.ul.setAttribute("pID", this.id);
                li.appendChild(li.ul);

                if(tThis.treeType == _TREE_TYPE_SINGLE) {
                    $(li.checkbox).addClass("hidden");
                }

                if(this.children.length > 0) {                  
                    this.opened = !this.opened;
                    clickSwich(this);

                    li.selfIcon.addClass("folder");
                }
                else { // is leaf
                    $(li.switchIcon).addClass("node_leaf").css("cursor", "default");
                    li.selfIcon.addClass("leaf");
                }

                // 添加事件
                var nThis = this;
                li.a.onclick = function(event) {
                    nThis.active();

                    event.node = nThis;
                    eventNodeActived.fire(event);
                };
                li.a.ondblclick = function(event) {
                    nThis.active();

                    event.node = nThis;
                    eventNodeDoubleClick.fire(event);
                };
                li.a.oncontextmenu = function(event) {
                    nThis.active();

                    // 触发右键激活节点事件
                    var _event = $.Event.createEventObject();
                    _event.treeNode = nThis;
                    _event.clientX = event.clientX;
                    _event.clientY = event.clientY;
                    eventNodeRightClick.fire(_event);
                };

                $(li.switchIcon).click( function() { clickSwich(nThis); } );
                $(li.checkbox).click( function() { checkNode(nThis); } );

                // 添加拖到事件处理
                $(li).addEvent("dragstart", function(ev){
                    var dt = ev.dataTransfer;
                    dt.effectAllowed = 'move';
                    dt.setData("text", li.node.id);
                }, true);        

                $(li).addEvent("dragend", function(ev) {
                    ev.dataTransfer.clearData("text");
                    $.Event.cancel(ev); // 不执行默认处理，拒绝被拖放
                }, true);


                $(li).addEvent("drop", function(ev){
                    var dt = ev.dataTransfer;
                    var nodeId = dt.getData("text");
                    var dragEL = $("li[nodeId='" + nodeId + "']")[0];

                    // 平级拖动，用以排序.暂不支持跨级拖动
                    if( this.node.parent == dragEL.node.parent ) {
                        // 触发自定义事件
                        var eObj = $.Event.createEventObject();
                        eObj.dragNode = dragEL.node;
                        eObj.destNode = this.node;
                        eObj.ownTree  = tThis;
                        eventNodeMoved.fire(eObj); 
                    }                   

                    $.Event.cancel(ev);
                }, true);

                $(li).addEvent("dragover", function(ev) {
                    $.Event.cancel(ev);
                }, true);

                return li;
            },
            
            disable: function() {
                this.disabled = "1";
                $(this.li.a).addClass("disable");
                this.li.node.refreshCheckState();
            },

            isEnable: function() {
                return this.disabled != "1";
            },

            active: function() {
                $.each(tThis.el.querySelectorAll("li"), function(i, li) {
                    $(li.a).removeClass("active");
                });

                $(this.li.a).addClass("active");
            },

            inactive: function() {
                $(this.li.a).removeClass("active");
            },

            openNode: function() {
                clickSwich(this);
            },

            refreshCheckState: function(newState) {
                this.checkState = newState != null ? newState : this.checkState;
                $(this.li.checkbox).removeClass("checkstate_0_" + this.disabled)
                    .removeClass("checkstate_1_" + this.disabled)
                    .removeClass("checkstate_2_" + this.disabled)
                    .addClass("checkstate_" + this.checkState + "_" + this.disabled);

                var ev = window.event || {};
                ev.node = this;
                ev.checkState = this.checkState;
                eventNodeChecked.fire(ev);
            },

            getAttribute: function(name) {
                return this.attrs[name];
            },

            setAttribute: function(name, value) {
                if(value) {
                    this.attrs[name] = value;
                } else {
                    delete this.attrs[name];
                }
            }
        };
        /********************************************* 定义树节点TreeNode end *********************************************/

        tThis.init();
        tThis.searcher = new Searcher(tThis);

        tThis.checkNode = checkNode;
        tThis.TreeNode = TreeNode;
    };

    Tree.prototype = {

        getTreeNodeById: function(id) {
            var li = this.el.querySelector("li[nodeId='" + id + "']");
            return li ? li.node : null;
        },

        /* 获取当前高亮（激活）的节点（被激活的节点一次只有一个）。如没有，则返回null。*/
        getActiveTreeNode: function() {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var activeNode;
            $.each(lis, function(i, li) {
                if( $(li.a).hasClass("active") ) {
                    activeNode = li.node;
                }
            });

            return activeNode
        },

        getActiveTreeNodeId: function(key) {
            var activeNode = this.getActiveTreeNode();
             return activeNode ? activeNode.id : "";
        }, 

        getActiveTreeNodeName: function(key) {
            var activeNode = this.getActiveTreeNode();
            return activeNode ? activeNode.name : "";
        }, 

        getActiveTreeNodeAttr: function(key) {
            var activeNode = this.getActiveTreeNode();
            if(activeNode) {
                return activeNode.attrs[key];
            }
        }, 

        // 如果找不到指定的treeNode，或id为空，则清空原active节点
        setActiveTreeNode: function(idOrnode) {
            var activeNode = this.getActiveTreeNode();
            if(activeNode) {
                activeNode.inactive();
            }
            if(!idOrnode) return;

            var treeNode = idOrnode.active ? idOrnode : this.getTreeNodeById(idOrnode);
            if(treeNode) {
                treeNode.active();
                this.scrollTo(treeNode);
            }
        },

        // 让新增节点出现在可视区域内。
        addTreeNode: function(newNode, parent) {
            parent = parent || this.getActiveTreeNode();

            if(newNode.nodeType) { // xml
                var nodeAttrs = {};
                $.each(newNode.attributes, function(j, attr) {
                    nodeAttrs[attr.nodeName] = attr.value;
                });

                newNode = nodeAttrs;
            }

            var treeNode = new this.TreeNode(newNode, parent);
            if( $("li", parent.li.ul).length == 0 ) {
                $(parent.li.switchIcon).removeClasses("node_leaf,node_close").addClass("node_open");
                parent.li.selfIcon.removeClass("leaf").addClass("folder");
            }

            parent.li.ul.appendChild(treeNode.toHTMLEl());

            this.scrollTo(treeNode);
        },

        // 删除li, 并从其parent.children中去除
        removeTreeNode: function(treeNode, retainEl) {
            retainEl = retainEl || false;
            if( !retainEl ) {
                $.removeNode(treeNode.li);
            }

            var parent = treeNode.parent;
            parent.children.remove(treeNode);
            if(parent.children.length == 0) {
                $(parent.li.switchIcon).removeClasses("node_open,node_close").addClass("node_leaf");
                parent.li.selfIcon.removeClass("folder").addClass("leaf");
            }
        },
        // 删除当前选中的节点
        removeActiveNode: function() {
            this.removeTreeNode(this.getActiveTreeNode());
        },

        /*
         * 移动节点位置。
         * 参数：  from    移动节点TreeNode对象
         *          to      目标节点TreeNode对象
         */
        moveTreeNode: function(from, to) {
            var parent = to;
            while(parent) {
                if(parent == from) {
                    return $.alert("不能向自己的内部节点移动。"); // 不能移动到子节点里
                }
                parent = parent.parent;
            }

            this.removeTreeNode(from); // 将from从其原parent.children里剔除

            from.parent = to;
            to.children.push(from);

            to.li.ul.appendChild(from.li);
        },

        sortTreeNode: function(dragNode, destNode) {
            destNode.li.parentNode.insertBefore(dragNode.li, destNode.li);
        },

        searchNode: function(searchStr) {
            this.searcher.search(searchStr)
        },

        /* 将节点滚动到可视范围之内 */
        scrollTo: function(treeNode) {
            var temp = treeNode;
            while(temp = temp.parent) {
                if(!temp.opened) {
                    temp.openNode();
                }
            }

            this.el.scrollTop = treeNode.li.offsetTop - this.el.clientHeight / 2;
        },

        getCheckedIds: function(includeHalfChecked, idName) {
            var checkedNodes = this.getCheckedNodes(includeHalfChecked);
            var checkedNodeIds = [];
            checkedNodes.each(function(i, node){
                checkedNodeIds.push(node[idName || "id"]);
            });

            return checkedNodeIds;
        },

        getCheckedNodes: function(includeHalfChecked) {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var checkedNodes = [];
            $.each(lis, function(i, li) {
                if( $(li.checkbox).hasClass("checkstate_2_0") || $(li.checkbox).hasClass("checkstate_2_1") ) {
                    checkedNodes.push(li.node);
                }

                if(includeHalfChecked) {
                    if( $(li.checkbox).hasClass("checkstate_1_0") || $(li.checkbox).hasClass("checkstate_1_1") ) {
                        checkedNodes.push(li.node);
                    }
                }
            });

            return checkedNodes;
        },

        setCheckValues: function(checkedIds, clearOld) {
            var checkedNodes = this.getCheckedNodes(true);
            checkedNodes.each(function(i, node){
                node.refreshCheckState(0);
            });

            if( !checkedIds ) return;

            checkedIds = checkedIds.length ? checkedIds : checkedIds.split(',');
            for(var i = 0; i < checkedIds.length; i++) {
                var li = this.el.querySelector("li[nodeId='" + checkedIds[i] + "']");
                if(li) {
                    this.checkNode(li.node, false);
                }
            } 
        },

        getAllNodes: function() {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var nodes = [];
            $.each(lis, function(i, li) {
                if(li.node.id != "_root") {
                     nodes.push(li.node);
                }
            });
            return nodes;
        },

        getAllNodeIds: function() {
            var nodes = this.getAllNodes();
            var nodeIds = [];
            nodes.each(function(i, node){
                nodeIds.push(node.id);
            });
            return nodeIds;
        }
    };

    /********************************************* 定义树查找对象 start *********************************************/
    var Searcher = function(tree) {
        var findedNodes, currentIndex, lastSearchStr;

        this.search = function(searchStr) {
            if($.isNullOrEmpty(searchStr)) {
                return $.alert("查询条件不能为空！");
            }

            if(lastSearchStr == searchStr) {
                this.next();
                return; 
            }

            findedNodes = [];
            currentIndex = -1;
            lastSearchStr = searchStr;

            var aNodeList = tree.el.querySelectorAll("li>a[title*='" + searchStr + "']");
            $.each(aNodeList, function(i, aNode) {
                findedNodes.push(aNode.parentNode.node);
            });

            this.next();
        }

        this.next = function() {
            var node;
            if(findedNodes.length) {
                node = findedNodes[++ currentIndex % findedNodes.length];
            }
            else {
                $(tree.el).notice("没有找到名称含有【" + lastSearchStr + "】的树节点。");
            }
            tree.setActiveTreeNode(node);
        }
    }

    return Tree;
});