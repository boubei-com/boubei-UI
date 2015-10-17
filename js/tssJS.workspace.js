

/* 布局组件 */
;(function ($, factory) {

    $.WorkSpace = factory($);

})(tssJS, function($) {

    'use strict';

    var 
    /* 样式名 */
    CSS_CLASS_TAB_BOX_HAS_TAB = "hasTab",
    CSS_CLASS_TAB_ACTIVE      = "active",
    CSS_CLASS_PHASE_ACTIVE    = "active",

    /* 点击Phase到展现内容的时间差(ms) */
    _TIMEOUT_PHASE_CLICK = 100,
    phaseClickTimeout,

    /* 自定义标签名（不含命名空间） */
    WS_NAMESPACE     = "WorkSpace",
    WS_TAG_PAGE      = "Page",
    WS_TAG_TAB       = "Tab",
    WS_TAG_TAB_BOX   = "TabBox",
    WS_TAG_PHASE     = "Phase",
    WS_TAG_PHASE_BOX = "PhaseBox",
    WS_TAG_ICON      = "Icon",
 
    /*******  Page: 管理单个子页面的显示、隐藏等控制 *********/
    Page = function (obj) { 
        this.el = obj;
        this.id = obj.id;       
        this.hide(); 
    };

    Page.prototype = {
        /* Page隐藏  */
        hide: function() {
            this.el.style.display = "none"; 
            this.isActive = false;
        },

        /* Page显示 */
        show: function() {
            this.el.style.display = "block";
            this.el.scrollTop  = 0;
            this.el.scrollLeft = 0;
            this.isActive = true;
        }
    };
 
    /*******  Tab: 负责生成水平标签页 *********/
    var Tab = function(label, phasesParams, callback, workspace) {
        this.ws = workspace;

        this.isActive = false;
        this.callback = callback;
        this.link;
        
        this.phases = {};
        this.phasesParams = phasesParams;  
        
        this.el = $.createNSElement(WS_TAG_TAB, WS_NAMESPACE);
        this.id = this.el.uniqueID;
         
        var closeIcon = $.createNSElement(WS_TAG_ICON, WS_NAMESPACE);
        closeIcon.title = "关闭";     
        this.el.appendChild(closeIcon);
        
        var div = $.createElement("div");
        $(div).html(label).title(label);
        div.noWrap = true; // 不换行
        this.el.appendChild(div);
        
        var oThis = this;
        closeIcon.onclick = this.el.ondblclick = function() {
            oThis.close();
        };  
        this.el.onclick = function() {
            if (!oThis.isActive && oThis.el) {
                oThis.click();
            }       
        };  
    };

    Tab.prototype = {

        close: function() {

            // 如果关闭的是当前激活的Tab，则需要在关闭完成后切换到第一个Tab
            var isCloseActiveTab = (this == this.ws.getActiveTab()); 
            if( isCloseActiveTab ) {
                this.clearPhases();
                if( this.link ) {
                    this.hideLink();
                }
            }

            delete this.ws.tabs[this.id];

            $.removeNode(this.el);

            this.el = this.id = this.link = null;
            this.phases = {};
            this.phasesParams = null;

            // 执行Tab页上定义的回调方法
            this.execCallBack("onTabClose", this.SID);

            if( this.ws.noTabOpend() ) {
                $(this.ws.element).hide();
            } 
            else if( isCloseActiveTab ) {
                this.ws.switchToTab(this.ws.getFirstTab());
            }
        },

        /* 点击标签 */
        click: function() {
            this.ws.inactiveAllTabs();
            this.active();

            // 执行Tab页上定义的回调方法
            this.execCallBack("onTabChange");

            if( this.link ) {
                this.showLink();
                this.refreshPhases();
            }
        },

        /* 显示关联子页面  */
        showLink: function() {
            this.ws.showPage(this.link);
        },

        /* 关闭（隐藏）关联子页面 */
        hideLink: function() {
            this.link.hide();
        },

        /* 高亮标签 */
        active: function() {
            $(this.el).addClass(CSS_CLASS_TAB_ACTIVE);
            this.isActive = true;
        },

        /* 低亮标签  */
        inactive: function() {
            $(this.el).removeClass(CSS_CLASS_TAB_ACTIVE);
            this.isActive = false;
        },

        /* 将标签与Page对象关联 */
        linkTo: function(page) {
            this.link = page;
        },

        /* 将标签插入指定容器 */
        dockTo: function(container) {
            container.appendChild(this.el);
        },
 
        /* 切换到指定Tab页 */
        switchToPhase: function(phase) {
            if( phase ) {
                phase.click();
            }       
        },

        /* 刷新纵向标签  */
        refreshPhases: function() {
            this.clearPhases();
            
            if( this.phasesParams == null ) return;

            // 重新创建纵向标签
            for(var i=0; i < this.phasesParams.length; i++) {
                var param  = this.phasesParams[i];
                var pageId = param.page;
                var page   = this.ws.pages[pageId];

                var phase  = new Phase(param.label, this.ws);
                phase.linkTo(page);
                phase.dockTo(this.ws.phaseBox);
                if(pageId == this.link.id) {
                    phase.active();
                }

                this.phases[phase.id] = phase;
            }

            this.ws.phaseBox.style.display = "inline";  /* 显示右侧容器 */
        },

        /* 清除纵向标签  */
        clearPhases: function() {
            for(var item in this.phases) {
                var phase = this.phases[item];
                phase.dispose();
            }
            this.ws.phaseBox.innerHTML = "";
        },

        /* 低亮所有Phase标签 */
        inactiveAllPhases: function() {
            $.each(this.phases, function(name, phase) {
                phase.inactive();
            });
        },

        /* 获取激活的纵向标签 */
        getActivePhase: function() {
            for(var item in this.phases) {
                var curPhase = this.phases[item];
                if( curPhase.isActive ) {
                    return curPhase;
                }
            }
        },

        /* 激活上一个纵向标签  */
        prevPhase: function() {       
            var phaseArray = [], activePhaseIndex;

            $.each(this.phases, function(name, phase) {
                if( phase.isActive ) {
                    activePhaseIndex = phaseArray.length;
                }
                phaseArray[phaseArray.length] = phase;
            });
            
            // activePhaseIndex == 0 表示当前激活的是第一个Phase，即到顶了，则不再往上
            if( activePhaseIndex === 0) { 
                return;
            }
            this.switchToPhase(phaseArray[--activePhaseIndex]);
        },

        /* 激活下一个纵向标签 */
        nextPhase: function() {
            var phaseArray = [], activePhaseIndex = 0;
            $.each(this.phases, function(name, phase) {
                if( phase.isActive ) {
                    activePhaseIndex = phaseArray.length;
                }
                phaseArray[phaseArray.length] = phase;
            });

            // activePhaseIndex == phaseArray.length - 1 表示当前激活的是最后一个Phase，即到末尾了
            if(activePhaseIndex === phaseArray.length - 1) { 
                return;
            }
            this.switchToPhase(phaseArray[++activePhaseIndex]);
        },

        /*
         *  执行回调函数
         *  参数：  string:eventName        事件名称
                    object:params           回调函数可用参数
         */
        execCallBack: function(eventName, params) {
            if( this.callback ) {
                $.execCommand(this.callback[eventName], params);
            }
        }
    };

    /* **************** Phase ：负责生成右侧纵向标签页 ***********************/
    var Phase = function(label, workspace) {
        this.ws = workspace;

        this.link;
        this.isActive = false;
        
        this.el = $.createNSElement(WS_TAG_PHASE, WS_NAMESPACE);
        this.id = this.el.uniqueID;
        
        var div = $.createElement("div");
        $(div).html(label).title(label);
        div.noWrap = true;
        
        this.el.appendChild(div);       
        
        var oThis = this;
        this.el.onclick = function() {
            if (!oThis.isActive) {
                oThis.click();
            }       
        };  
    }

    Phase.prototype = {
        /* 将标签与Page对象关联  */
        linkTo: function(pageInstance) {
            this.link = pageInstance;
        },

        /* 将标签插入指定容器 */
        dockTo: function(container) {
            container.appendChild(this.el);
        },

        /* 释放纵向标签实例 */
        dispose: function() {
            var curActiveTab = this.ws.getActiveTab();
            delete curActiveTab.phases[this.id];
            $.removeNode(this.el);
            this.el = this.id = this.link = null;
        },

        /* 点击标签  */
        click: function() {
            var activeTab = this.ws.getActiveTab();
            activeTab.inactiveAllPhases();

            this.active();
            this.scrollToView();

            var thisPhase = this;

            // 避免切换太快时显示内容跟不上响应
            clearTimeout( phaseClickTimeout );
            
            phaseClickTimeout = setTimeout( function() {
                /* 显示关联子页面 */
                if( thisPhase.link ) {
                    this.ws.showPage(thisPhase.link);
                    activeTab.linkTo(thisPhase.link);
                }
            }, _TIMEOUT_PHASE_CLICK );
        },

        /* 将控制标签显示在可见区域内 */
        scrollToView: function() {
            var tempTop = this.el.offsetTop;
            var tempBottom = this.el.offsetTop + this.el.offsetHeight;
            var areaTop = this.ws.phaseBox.scrollTop;
            var areaBottom = areaTop + this.ws.phaseBox.offsetHeight;
            if(tempTop < areaTop) {
                this.ws.phaseBox.scrollTop = tempTop;
            }
            else if(tempBottom > areaBottom) {
                this.ws.phaseBox.scrollTop = tempBottom - this.ws.phaseBox.offsetHeight;
            }
        },

        /* 高亮纵向标签 */
        active: function() {
            $(this.el).addClass(CSS_CLASS_PHASE_ACTIVE);
            this.isActive = true;
        },

        /* 低亮纵向标签 */
        inactive: function() {
            $(this.el).removeClass(CSS_CLASS_PHASE_ACTIVE);
            this.isActive = false;
        }
    }

    /* ***********************************************************************************************
       控件名称：标签式工作区
       功能说明：1、动态创建Tab标签
                 2、动态创建纵向Tab标签
                 3、Tab标签控制子页面显示
                 4、双击Tab标签可关闭 
    * ***********************************************************************************************/
    var WorkSpace = function(ws) {
        this.element = ws.nodeType ? ws : $("#" + ws)[0];
 
        this.tabs  = {};
        this.pages = {};

        /* 初始子页面 */
        var childs = $.getNSElements(this.element, WS_TAG_PAGE, WS_NAMESPACE);
        for(var i=0; i < childs.length; i++) {
            var curNode = childs[i]; 
            this.pages[curNode.id] = new Page(curNode);
        }

        this.createUI();
    };

    WorkSpace.prototype = {

        /* 创建界面展示 */
        createUI: function() {
            /* 创建Tab标签的容器 */
            this.tabBox = $.createNSElement(WS_TAG_TAB_BOX, WS_NAMESPACE);
            this.element.appendChild(this.tabBox);
            
            var refChild = this.element.firstChild;
            if(refChild != this.tabBox) {
                this.element.insertBefore(this.tabBox, refChild); // 插入到第一个
            }

            /* 创建纵向Tab标签的容器 */
            this.phaseBox = $.createNSElement(WS_TAG_PHASE_BOX, WS_NAMESPACE);
            this.element.appendChild(this.phaseBox);

            var refChild = this.element.childNodes[1];
            if(this.phaseBox != refChild && refChild) {
                this.element.insertBefore(this.phaseBox, refChild);
            }

            // 隐藏右侧容器
            this.phaseBox.style.display = "none"; 
        },
         
        /* 打开子页面  */
        open: function(inf) {
            this.element.style.display = "";

            var tab;
            for(var item in this.tabs) {
                if(inf.SID == this.tabs[item].SID) {
                    tab = this.tabs[item];
                }
            }
            
            // 不存在同一数据源tab则新建
            if(null == tab) {             
                tab = new Tab(inf.label, inf.phases, inf.callback, this);
                tab.SID = inf.SID; // 标记
                this.tabs[tab.id] = tab;

                var page = this.pages[inf.defaultPage];
                tab.linkTo(page);
                tab.dockTo(this.tabBox);

                $(this.tabBox).addClass(CSS_CLASS_TAB_BOX_HAS_TAB);
            }
            
            tab.click();
            return tab;
        },

        showPage: function(page) {
            /* 先隐藏所有子页面  */
            for(var item in this.pages) {
                var curPage = this.pages[item];
                if(curPage.isActive) {
                    curPage.hide();
                }
            }

            page.show();
        },

        /* 获得第一个Tab */
        getFirstTab: function() {
            for(var item in this.tabs) {
                return this.tabs[item];
            }
        },

        /* 切换到指定Tab页 */
        switchToTab: function(tab) {
            if( tab ) {
                tab.click();
            } 
            else {
                $(this.tabBox).removeClass(CSS_CLASS_TAB_BOX_HAS_TAB);
            }
        },

        /* 获取当前激活标签 */
        getActiveTab: function() {
            for(var item in this.tabs) {
                var tab = this.tabs[item];
                if( tab.isActive ) {
                    return tab;
                }
            }
        },

        getTab: function(sid) {
            for(var item in this.tabs) {
                var tab = this.tabs[item];
                if( tab.SID === sid ) {
                    return tab;
                }
            }
        },

        closeTab: function(sid) {
            var tab = this.getTab(sid);
            if(tab) {
                tab.close();
            }
        },

        /* 关闭当前激活标签 */
        closeActiveTab: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                tab.close();
            }
        },

        /* 低亮所有标签 */
        inactiveAllTabs: function() {
            for(var item in this.tabs) {
                var curTab = this.tabs[item];
                curTab.inactive();
            }
        },
         
        /* 激活上一个Phase标签 */
        prevPhase: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                return tab.prevPhase();
            }
        },

        /* 激活下一个Phase标签 */
        nextPhase: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                return tab.nextPhase();
            }
        },

        switchToPhase: function(pageId) {
            var page = this.pages[pageId];
            this.showPage(page);
        },

        noTabOpend: function() {
            var length = 0; 
            for(var item in this.tabs) {
                length ++;
            }
            return length == 0;
        }
    };

    return WorkSpace;
}); 