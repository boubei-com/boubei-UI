

/* 
 * panel 
 */
;(function($){

    $.openIframePanel = function(panelId, title, width, height, src, hideMaxMin) {
        var $panel = $("#" + panelId);
        if( !$panel.length ) {
            var panel = $.createElement("div", "panel", panelId);
            document.body.appendChild(panel);
            
            $panel = $(panel);
            $panel.css("width", width + "px").css("height", height + "px").center();
            $panel.panel(title, '<iframe frameborder="0"></iframe>', false);

            if(hideMaxMin) {
                $panel.find(".max").hide();
                $panel.find(".min").hide();
            }       
        }

        $panel.find(".title>h2").html(title);
        $panel.find("iframe").attr("src", src);
        $panel.show();
    }

    $.fn.extend({
        panel: function(title, contentHtml, resizable, moveable) {
            if(this.length > 0) {
                return new Panel(this[0], title, contentHtml, resizable, moveable);
            }
        }
    });

    var panelIndex = 1;

    var Panel = function(el, title, contentHtml, resizable, moveable) {
        this.el = el;
        this.$el = $(el);
        this.$el.html(
            '<div class="title">' + 
                '<h2> - ' +title+ '</h2>' + 
                '<div>' + 
                    '<span class="min" title="最小化"></span>' + 
                    '<span class="max" title="最大化"></span>' + 
                    '<span class="revert" title="还原"></span>' + 
                    '<span class="close" title="关闭"></span>' + 
                '</div>' + 
            '</div>' + 
            '<div class="content">' + contentHtml + '</div>'
        );
        this.$el.addClass("tss-panel").css("zIndex", panelIndex++);

        if(moveable == null || moveable) {
            this.$el.drag();
        }
        if(resizable) {
            this.$el.resize().resize("col").resize("row");
        }

        this.width  = el.clientWidth;
        this.height = el.clientHeight;
        this.location = $.absPosition(el);

        var $title = $(".title", el);
        var $content = $(".content", el);

        var $min = $(".min", el);
        var $max = $(".max", el);
        var $revert = $(".revert", el);
        var $close = $(".close", el);

        var oThis = this;

        this.$el.click(function() {
            oThis.$el.css("zIndex", panelIndex++);
        });

        $max.click(function(){
            var inner = $.getInner();
            oThis.$el.css('width',  "100%")
                .css('height', "100%")
                .css('top', '0px').css('left', '0px');
            oThis.$el.addClass('tss-panel-max').removeClass("tss-panel-min");

            $max.hide();
            $min.hide();
            $revert.show(true);
            $content.show();
        });

        $revert.click(function(){
            var inner = $.getInner();
            oThis.$el.removeClass('tss-panel-max')
                .css('width', oThis.width + "px")
                .css('height', oThis.height + "px")
                .css('left', oThis.location.left + 'px').css('top', oThis.location.top + 'px');
            $max.show(true);
            $min.show(true);
            $revert.hide();
        });

        $min.click(function(){
            if(oThis.$el.hasClass("tss-panel-min")) {
                oThis.$el.removeClass("tss-panel-min").css('height', oThis.height + "px");
                $content.show();
            } 
            else {
                oThis.$el.addClass("tss-panel-min").removeClass('tss-panel-max')
                    .css('width', oThis.width + "px")
                    .css('height', "");
                $max.show(true);
                $revert.hide();
                $content.hide();
            }
        });

        $close.click(function(){
            oThis.$el.hide();
        });

        function cancelBubble(ev) {
            this.onfocus = function () {this.blur()};
            $.Event.cancel(ev)
        }
        $min.addEvent("mousedown", cancelBubble);
        $max.addEvent("mousedown", cancelBubble);
        $revert.addEvent("mousedown", cancelBubble);
        $close.addEvent("mousedown", cancelBubble);
    }

})(tssJS);

/*
 *  左栏
 */
;(function($) {
 
    $.leftbar = function(fn1, fn2) {

        var t,
            closeLeftbar = function() {
                $(".leftbar").removeClass("leftbar-open").addClass("leftbar-hidden");
                clearTimeout( t );
            },
            showLeftbar = function() {
                $(".leftbar").removeClass("leftbar-hidden").addClass("leftbar-open");
                t = setTimeout( closeLeftbar, 3000);
            };

        var barWidth = 30, f = 0;

        this.init = function() {
            this.createInDomTree();

            $(".leftbar-menu").toggle(fn1, fn2 || fn1);
            $(document).addEvent("mousemove", this.onMouseMove);
        };

        this.createInDomTree = function() {
            var el = $.createElement("div", "leftbar");
            $(el).addClass("leftbar-hidden");
            $(el).html('<div class="leftbar-menu"><span>&nbsp;</span></div>');

            document.body.appendChild(el);
        };
        
        this.onMouseMove = function(ev) {
            ev.stopImmediatePropagation();

            var _x = ev.clientX > 0 ? ev.clientX : 1, 
                i = parseInt(100 / parseInt(document.body.clientWidth / _x, 10), 10), 
                s = !1;

            if (Math.abs(i - f) < 10)
                return;

            $(".leftbar").hasClass("leftbar-open") && _x > barWidth && closeLeftbar();

            if (i >= 10 && i <= 50) {
                var o = barWidth * i * 12 / 100;
                f > i ? s = barWidth - o : s = -o;
                s = Math.ceil(s);
                s > 0 && (s = 0)
            } 
            else {
                i > 50 ? s = -parseInt(barWidth, 10) : i >= 0 && i < 10 && (s = 0);
            }
            
            if (s === 0) {
                showLeftbar();
            }
            f = i;
        };

        this.init();
    }

})(tssJS);


/*
 *  drag / resize
 */
tssJS(function() {
    // 钩子
    $(".moveable").each(function(i, el){
        $(el).drag();
    });

    $(".resizable").each(function(i, el){
        $(el).resize().resize("col").resize("row");
    })
});

tssJS.fn.extend({
    drag: function(handle) {
        var element = this[0];
        handle = handle || $("h1", element)[0] || $("h2", element)[0] || element; // 拖动条
        if(handle == null) return;

        var mouseStart  = {x:0, y:0};  // 鼠标起始位置
        var elementStart = {x:0, y:0};  // 拖动条起始位置

        handle.onmousedown = function(ev) {
            var oEvent = ev || window.event;
            mouseStart.x  = oEvent.clientX;
            mouseStart.y  = oEvent.clientY;
            elementStart.x = element.offsetLeft;
            elementStart.y = element.offsetTop;

            if (handle.setCapture) {
                handle.onmousemove = doDrag;
                handle.onmouseup = stopDrag;
                handle.setCapture();
            } else {
                document.addEventListener("mousemove", doDrag, true);
                document.addEventListener("mouseup", stopDrag, true);
            }

            return false;
        };

        function doDrag(ev) {
            ev = ev || window.event;

            var x = ev.clientX - mouseStart.x + elementStart.x;
            var y = ev.clientY - mouseStart.y + elementStart.y;

            element.style.left = x + "px";
            element.style.top  = y + "px";
        };

        function stopDrag() {
            if (handle.releaseCapture) {
                handle.onmousemove = null;
                handle.onmouseup = null;
                handle.releaseCapture();
            } else {
                document.removeEventListener("mousemove", doDrag, true);
                document.removeEventListener("mouseup", stopDrag, true);
            }
        };

        return this;
    },

    resize: function(type) {
        var element = this[0];

        var handle = document.createElement("DIV"); // 拖动条
        var cssText = "position:absolute;overflow:hidden;z-index:3;";
        if (type == "col") {
            handle.style.cssText = cssText + "cursor:col-resize;top:0px;right:0px;width:3px;height:100%;";
        } else if(type == "row") {
            handle.style.cssText = cssText + "cursor:row-resize;left:0px;bottom:0px;width:100%;height:3px;";
        } else {
            handle.style.cssText = cssText + "cursor:nw-resize;right:0px;bottom:0px;width:8px;height:8px;background:#99CC00";
        }
        
        element.appendChild(handle);

        var mouseStart  = {x:0, y:0};  // 鼠标起始位置
        var handleStart = {x:0, y:0};  // 拖动条起始位置

        handle.onmousedown = function(ev) {
            var oEvent = ev || window.event;
            mouseStart.x  = oEvent.clientX;
            mouseStart.y  = oEvent.clientY;
            handleStart.x = handle.offsetLeft;
            handleStart.y = handle.offsetTop;

            document.addEventListener("mousemove", doDrag, true);
            document.addEventListener("mouseup", stopDrag, true);

            $.showWaitingLayer(); // 创建一个遮罩层，防止存在iframe时捕捉不到mousemove事件

            return false;
        };

        function doDrag(ev) {
            var oEvent = ev || window.event;

            // 水平移动距离
            if (type == "col" || type == null) {
                var _width = oEvent.clientX - mouseStart.x + handleStart.x + handle.offsetWidth;
                if (_width < handle.offsetWidth) {
                    _width = handle.offsetWidth;
                } 
                else if (_width > document.documentElement.clientWidth - element.offsetLeft) {
                    _width = document.documentElement.clientWidth - element.offsetLeft - 2; // 防止拖出窗体外
                }
                element.style.width = _width + "px";
            }

            // 垂直移动距离
            if (type == "row" || type == null) {
                var _height = oEvent.clientY - mouseStart.y + handleStart.y + handle.offsetHeight;
                if (_height < handle.offsetHeight) {
                    _height = handle.offsetHeight;
                } 
                else if (_height > document.documentElement.clientHeight - element.offsetTop) {
                    _height = document.documentElement.clientHeight - element.offsetTop - 2; // 防止拖出窗体外
                }
                element.style.height = _height + "px";
            }
        };

        function stopDrag() {
            document.removeEventListener("mousemove", doDrag, true);
            document.removeEventListener("mouseup", stopDrag, true);
            $.hideWaitingLayer();
        };

        return this;
    }
});