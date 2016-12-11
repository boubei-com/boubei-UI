
/* tip, 提示气泡 */
;(function($, factory) {

    $.Bubble = $.Balloon = factory($);

    $.notice = function(targetEl, msg, delay) {
        var balloon = new $.Bubble(msg);
        balloon.dockTo(targetEl, delay);
    };

    $.fn.extend({
        notice: function(msg, delay) {
            if(this.length > 0) {
                $.notice(this[0], msg, delay);
            }
        }
    });

})(tssJS, function($){
    'use strict';

    var _STYLE_BUBBLE = "tssJS-bubble",
        _STYLE_ARROW_TOP = "tssJS-bubble-arrow-top",
        _STYLE_ARROW_BOTTOM = "tssJS-bubble-arrow-bottom",      
        NEXT_ZINDEX  = 1000,
        BUBBLE_WIDTH = 200,
        ARROW_HEIGHT = 15,

    timeout,
    dispose = function() {
        var buddles = $("." + _STYLE_BUBBLE);
        buddles.each(function() {
            $.removeNode(this);
        });
        
        $(document).removeEvent("mousedown", dispose);
    },

    Bubble = function(content) {
        this.el = $.createElement("div", _STYLE_BUBBLE);
        $(this.el).html("<p>" + content + "</p>");
        $(this.el).css("width", BUBBLE_WIDTH + "px");

        // 绑定事件，鼠标按下后气球消失
        $(document).addEvent("mousedown", dispose);
    };

    Bubble.prototype.dockTo = function(targetEl, delay){
        var position = $.absPosition(targetEl), 
            x = position.left + targetEl.offsetWidth/2 - BUBBLE_WIDTH/2, 
            y;

        if( position.bottom + 50 >= document.body.clientHeight) {
            y = position.top - ARROW_HEIGHT * 4.5 - this.el.offsetHeight; 
            $(this.el).addClass(_STYLE_ARROW_BOTTOM);
        }
        else {
            y = position.bottom + ARROW_HEIGHT;
            $(this.el).addClass(_STYLE_ARROW_TOP);
        } 
        
        $(this.el).css("zIndex", NEXT_ZINDEX++).css("left", x + "px").css("top", y + "px");
        document.body.appendChild(this.el);

        clearTimeout(timeout);
        timeout = setTimeout( dispose, delay || 3000 );
    }

    return Bubble;
});


;(function($) {

    var setHeight = function(tipEL, direction) {
        var popH = parseInt(tipEL.style.height);
        if (direction == "up") {
            if (popH <= 100) {
                $(tipEL).css("height", (popH + 4) + "px");
            } else {
                clearInterval(show);
            }
        }
        if (direction == "down") {
            if (popH >= 4) {
                $(tipEL).css("height", (popH - 4) + "px");
            } else {
                clearInterval(hide);
                $(tipEL).hide();
            }
        }
    }

    $.tssTip = function(content, title) {
        var $tipEL = $("#tssTip");
        if(!$tipEL.length) {
            var el = $.createElement("div", null, "tssTip");
            var html = [];
            html.push('<div class="title"><b>' + (title || '消息提醒') + '</b><span class="close" onclick="$.tssTip()">×</span></div>');
            html.push('<div class="content">' + content + '</div>');
            $tipEL = $(el);
            $tipEL.html(html.join("\n"));
            $tipEL.css("height", '0');

            $(document.body).appendChild(el);
        }

        title && $tipEL.find("div.title>b").html(title);
        content && $tipEL.find("div.content").html(content);

        var popH = parseInt($tipEL[0].style.height);
        if (popH == 0 || content) {
            $tipEL.show(true);
            show = setInterval( function() { setHeight($tipEL[0], 'up'); }, 20);
        } else {
            hide = setInterval( function() { setHeight($tipEL[0], 'down'); }, 20);
        }
    }

})(tssJS);


/* Tip/Alert/Confirm/Prompt */
(function($) {

    var popupBox = function(title, callback) {
        var $box = $("#alert_box");
        if($box.length > 0) {
            $box.remove();
        }

        var boxEl = $.createElement("div", "moveable", "alert_box");
        document.body.appendChild(boxEl);

        var html = [];
        html.push('  <h1 class="title"></h1>');
        html.push('  <span class="close"></span>');
        html.push('  <div class="content">');
        html.push('    <div class="message"></div>');
        html.push('    <div class="btbox"><input type="button" value="确 定" class="ok"></div>');
        html.push('  </div>');

        $box = $(boxEl).html(html.join("\n")).show().drag();
        $(".close", boxEl).click(closeBox);
        $("h1", boxEl).html(title).addClass("text2");
        $(".content .message", boxEl).addClass("text1");

        $(boxEl).center(360, 300);   
        callback && $.showWaitingLayer();

        return $box[0];
    },

    closeBox = function() {
        $("#alert_box").hide().remove();
        $.hideWaitingLayer();
    };

    // content：内容，title：对话框标题  
    $.tip = function(content, title) {
        var boxEl = popupBox(title || '消息提醒');
        $(".content", boxEl).addClass("tip");
        $(".btbox", boxEl).hide();
        $(".content .message", boxEl).html(content);
        $(boxEl).css("width", "250px").css("position", "fixed").css("right", "1px").css("bottom", "1px").css("top", "").css("left", "");
    };

    // content：内容，title：对话框标题，callback：回调函数    
    $.alert = function(content, title, callback) {
        var boxEl = popupBox(title || '提示', callback);
        $(".content", boxEl).addClass("alert");
        $(".content .message", boxEl).html(content);

        function ok() {
            closeBox();
            callback && callback();
        }
        $(".btbox .ok", boxEl).click(ok);
    };

    // content：内容，title：对话框标题，callback：回调函数
    $.confirm = function(content, title, callback, cancelCallback){
        var boxEl = popupBox(title || '确认框', callback);
        $(".content", boxEl).addClass("confirm");
        $(".content .message", boxEl).html(content || '你确认此操作吗?');
        $(".btbox", boxEl).html($(".btbox", boxEl).html() + '<input type="button" value="取 消" class="cancel">');

        function ok(result) {
            closeBox();
            if(result) {
                callback && callback();
            } else {
                cancelCallback && cancelCallback();
            }
        }
        $(".btbox .ok", boxEl).click(function() { ok(true); });
        $(".btbox .cancel", boxEl).click(function() { ok(false); });
    };

    // content：内容，deinput：输入框的默认值，title：对话框标题，callback：回调函数
    $.prompt = function(content, title, callback, deinput){
        var boxEl = popupBox(title || '输入框', callback);
        $(".content", boxEl).addClass("prompt");
        $(".content .message", boxEl).html( (content || "请输入：") + ':<br><input type="text">' );
        $(".content .message input", boxEl).value(deinput || '');
        $(".btbox", boxEl).html($(".btbox", boxEl).html() + '<input type="button" value="取 消" class="cancel">');       

        function ok() {
            var value = $(".content .message input", boxEl).value();

            closeBox();
            callback && callback(value);
        }
        $(".btbox .ok", boxEl).click(ok);
        $(".btbox .cancel", boxEl).click(closeBox);
    };

})(tssJS);


/* relogin */
;(function($){

    $.relogin = function(callback, msg) {
        var reloginBox = $("#relogin_box")[0];
        if(reloginBox == null) {
            var boxHtml = [];
            boxHtml[boxHtml.length] = "<h1>重新登录</h1>";
            boxHtml[boxHtml.length] = "<span> <input type='text' id='loginName' placeholder='请输入您的账号'/> </span>";
            boxHtml[boxHtml.length] = "<span> <input type='password' id='password' placeholder='请输入您的密码' /> </span>";
            boxHtml[boxHtml.length] = "<span class='bottonBox'>";
            boxHtml[boxHtml.length] = "  <button class='tssbutton blue small' id='bt_login'>确  定</button> &nbsp;&nbsp;";
            boxHtml[boxHtml.length] = "  <button class='tssbutton blue small' id='bt_cancel'>取  消</button>";
            boxHtml[boxHtml.length] = "</span>";

            reloginBox = $.createElement("div", "popupBox", "relogin_box");    
            document.body.appendChild(reloginBox);
            $(reloginBox).html(boxHtml.join(""));

            $("#bt_cancel").click(function() {
                $(reloginBox).hide();
            });

            var defaultUserName = $.Cookie.getValue("iUserName");
            if( defaultUserName ) {
                $("#loginName").value(defaultUserName);
            }
        }

        var title = "请输入账号密码";
        if(msg) {
            title = "重新登录，因" + msg.substring(0, 10) + (msg.length > 10 ? "..." : "");
        }
        $("h1", reloginBox).html(title);

        $(reloginBox).show(); // 显示登录框

        var loginNameObj = $("#loginName")[0];
        var passwordObj  = $("#password")[0];

        loginNameObj.focus();
        passwordObj.value = ""; // 清空上次输入的密码，以防泄密
        
        loginNameObj.onblur = function() { 
            var value = this.value;
            if(value == null || value == "") return;
            
            if(loginNameObj.identifier) {
                delete loginNameObj.identifier;
            }
            
            $.ajax({
                url: "/" + CONTEXTPATH + "getLoginInfo.in",
                params: {"loginName": value},
                onexcption: function() {
                    loginNameObj.focus();
                },
                onresult: function(){
                    loginNameObj.identifier = this.getNodeValue("identifier");
                    loginNameObj.randomKey  = this.getNodeValue("randomKey");
                    
                    passwordObj.focus();
                }
            });
        }

        $("#bt_login").click( function() { doLogin(); } );
        
        var doLogin = function() {
            var identifier = loginNameObj.identifier;
            var randomKey  = loginNameObj.randomKey;

            var loginName  = loginNameObj.value;
            var password   = passwordObj.value;
            
            if( "" == loginName ) {
                $.alert("请输入账号");
                loginNameObj.focus();
                return;
            } 
            else if( "" == password ) {
                $.alert("请输入密码");
                passwordObj.focus();
                return;
            } 
            else if( identifier == null ) {
                $.alert("无法登录，用户配置可能有误，请联系管理员。");
                return;
            } 

            callback(loginName, password, identifier, randomKey);

            $(reloginBox).hide();
        }
    }

})(tssJS);