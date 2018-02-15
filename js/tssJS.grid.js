

/* Grid组件 
 * 事件: onLoad, Grid更新加载完成后触发 $("#grid").attr("onLoad", "f1()");
 * TODO:
 *  !. Grid控件表头增加求和功能
 */
;(function ($, factory) {

    $.Grid = factory($);

    var GridCache = {};

    $.G = function(id, data) {
        var grid = GridCache[id];
        if( data ) {
            grid = new $.Grid($1(id), data);
            GridCache[grid.id] = grid;  
        }
        
        return grid;
    };

    $.fn.extend({
        grid: function(data) {
            if(this.length > 0) {
                return $.G(this[0].id, data);
            }
        }
    });

})(tssJS, function ($) {

    'use strict';

    var cellHeight = 22,  // 数据行高

    getAlign = function(column) {
        var align = column.getAttribute("align");
        if(align) {
            return align;
        }

        switch(column.getAttribute("mode")) {
            case "number":
            case "int":
                return "right";
            case "boolean":
            case "date":
            default:
                return "center";
        }
    },

    getCellValue = function(tr, colName) {
        var cells = curRow.cells;
        for(var j=0; j < cells.length; j++) {
            var cell = cells[j];
            if( cell.getAttribute("name") == colName ) {
                return cell.getAttribute("value");
            }
        }
    },

    bindAdjustTHHandler = function(table) { 

        $(".checkAll", table).click(function(){
            var allCheck = this.checked;
            $("input[name='grid_cb']", table).each(function(){
                this.checked = allCheck;
            });
        });

        $("thead tr td", table).each(function(i, th) {
            // 双击隐藏列
            th.ondblclick = function() {
                $(th).hide();
                $("tbody tr", table).each( function(j, row) {
                    $(row.cells[i]).hide();
                });
            };

            th.onmousedown = function() {
                if(window.event.offsetX > this.offsetWidth - 5) {
                    this.mouseDown = true;
                    this.oldX = window.event.x;
                    this.oldWidth = this.offsetWidth;
                }
            };

            // 结束宽度调整 
            th.onmouseup = function() {
                this.mouseDown = false;
                $(this).css("cursor", "default");
            };

            th.onmousemove = function(ev) {
                ev = ev || window.event;
                var colseToEdge = ev.offsetX > this.offsetWidth - 7;
                $(this).css("cursor", colseToEdge ? "col-resize" : "default");
                
                if( !!this.mouseDown ) {
                    $(this).css("cursor", "col-resize");

                    var distance = (ev.x - this.oldX);
                    $(this).css("width", (this.oldWidth + distance) + "px");
                }
            }
        });
    },

    bindSortHandler = function(table) { 
        var rows = [];
        var tbody = $("tbody", table)[0];
        $("tr", tbody).each( function(i, row) {
            rows[i] = row;
        });

        var thList = $("thead tr td", table);
        var direction = 1;
     
        thList.each( function(i, th) {
            var sortable = th.getAttribute("sortable");
            if( sortable == "true") {
                th._colIndex = i;

                $(th).click(function() {
                    // 先清除已有的排序
                    thList.each(function(i, _th) {
                        $(_th).removeClass("desc").removeClass("asc");
                    });
                    $(this).addClass(direction == 1 ? "desc" : "asc");

                    var columnIndex = this._colIndex;
                    rows.sort(function(row1, row2) {
                        var x = $.XML.getText(row1.cells[columnIndex]);
                        var y = $.XML.getText(row2.cells[columnIndex]);
                        var compareValue;
                        if( !x || isNaN(x) ) {
                            compareValue = x.localeCompare(y);
                        }
                        else {
                            compareValue = Number(x) - Number(y);
                        }
                        return compareValue * direction;
                    });

                    // 按排序结果对table进行更新，并设置排序列的样式                    
                    rows.each(function(i, row) {
                        $.each(row.cells, function(j, cell){
                            if(j == columnIndex) {
                                $(cell).addClass("sorting");
                            } else {
                                $(cell).removeClass("sorting");
                            }
                        });
                        
                        tbody.appendChild(row);
                        row.setAttribute("_index", i + 1);
                    });

                    direction = direction * -1;
                });
            }   
        });
    },

    XMLTempalte = function(dataXML) {
        this.declare = $("declare", dataXML)[0];
        this.script  = $("script", dataXML)[0];
        this.columns = this.declare.querySelectorAll("column");
        this.dataRows = dataXML.querySelectorAll("data row");

        var columnsMap = {};
        $.each(this.columns, function(index, column) {
            columnsMap[column.getAttribute("name")] = column;
        });
        this.columnsMap = columnsMap;

        this.hasHeader    = this.declare.getAttribute("header") == "checkbox";
        this.needSequence = this.declare.getAttribute("sequence") != "false";
    },

    JsonTemplate = function(dataJson) {
        // TODO 支持json格式的数据源
    };

    XMLTempalte.prototype = {
        toHTML: function(startNum) {
            var htmls = [], thead = [], tbody = [];

            thead.push('<thead><tr>');
            if(this.hasHeader) {
                thead.push('<td name="cellheader" style="width:30px"><input type="checkbox" class="checkAll"/></td>');
            }
            if(this.needSequence) {
                thead.push('<td name="sequence" style="width:30px">序号</td>');
            }
            $.each(this.columnsMap, function(name, column) {
                var caption = column.getAttribute("caption");
                var width   = column.getAttribute("width");
                var style = (width ? ' style="width:' + width + '"': '');
                var _class   = column.getAttribute("display")  == "none" ? ' class="hidden"' : '';
                var sortable = column.getAttribute("sortable") == "true" ? ' sortable="true"' : '';
                thead.push('<td name="' + name + '" ' + _class + style + sortable + '>' + caption + '</td>');
            });
            thead.push("</tr></thead>");
 
            var oThis = this;
            tbody.push('<tbody>');
            $.each(this.dataRows, function(i, row) {
                var index = startNum + i + 1;
                tbody.push('<tr _index="' + index + '">');

                if(oThis.hasHeader) {
                    tbody.push('<td></td>');
                }
                if(oThis.needSequence) {
                    tbody.push('<td></td>');
                }

                var columnsMap = oThis.columnsMap;
                for(var name in columnsMap) {
                    var value  = row.getAttribute(name) || "";
                    var _class = columnsMap[name].getAttribute("display")  == "none" ? ' class="hidden"' : '';
                    tbody.push('<td name="' + name + '" value="' + value + '" ' + _class + '>' + value + '</td>');
                }

                tbody.push("</tr>");
            });
            tbody.push("</tbody>");

            htmls.push("<table>");
            htmls.push(thead.join(""));
            htmls.push(tbody.join(""));
            htmls.push("</table>");
            return htmls.join("");
        }
    }; 

    var Grid = function(element, data) {
        this.id = element.id;
        this.gridBox = this.element = this.el = element;
        this.gridBox.innerHTML = "";

        // Grid控件上禁用默认右键
        (element.parentNode || document).oncontextmenu = function(_event) {
            $.Event.cancel(_event || window.event);
        }   

        this.gridBox.style.width = element.getAttribute("width")  || "100%";

        var pointHeight = element.getAttribute("height");
        if( pointHeight == null || pointHeight == '0' ) {
            pointHeight = element.clientHeight || element.parentNode.clientHeight; 
        }
        $(this.gridBox).css("height", pointHeight + "px"); // hack 固定住grid高度，以免在IE部分版本及FF里被撑开
        
        this.windowHeight = pointHeight;
        this.pageSize = Math.floor(this.windowHeight / cellHeight);
  
        this.load(data);    

        // 添加Grid事件处理
        this.addGridEvent();    
    };

    Grid.prototype = {
        load: function(data, append) {
            if("object" != typeof(data) || data.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                return $.alert("传入的Grid数据有问题。")  
            } 

            // 初始化变量
            var startNum = append ? this.totalRowsNum : 0;  

            this.template = new XMLTempalte(data);  
            var gridTableHtml = this.template.toHTML(startNum); // 解析成Html
          
            if(append) {
                var tempParent = $.createElement("div");
                $(tempParent).html(gridTableHtml);
                var newRows = tempParent.childNodes[0].tBodies[0].rows;
                for(var i=0; i < newRows.length; i++) {
                    var cloneRow = newRows[i].cloneNode(true);
                    this.tbody.appendChild(cloneRow);
                }
            }
            else {
                $(this.gridBox).html(gridTableHtml);
                this.tbody = $("tbody", this.gridBox)[0];
            }
          
            var table  = $("table", this.gridBox)[0];
            this.totalRowsNum = this.tbody.rows.length;
            for(var i = startNum; i < this.totalRowsNum; i++) {
                this.processDataRow(this.tbody.rows[i]); // 表格行TR
            }
           
            bindAdjustTHHandler(table);
            bindSortHandler(table);

            var onLoad = $(this.el).attr("onLoad");
            onLoad && $.execCommand(onLoad);
        }, 

        /* 处理数据行,将值解析成下拉列表值、图片、选择框等 */
        processDataRow: function(curRow) {
            $(curRow).hover(
                function() { 
                    $(curRow).addClass("highlight"); 
                }, 
                function() { 
                    $(curRow).removeClass("highlight");
                } 
            );
            
            var cells = curRow.cells;
            for(var j=0; j < cells.length; j++) {
                var cell = cells[j];

                var hasHeader = this.template.hasHeader;
                if(hasHeader && j == 0) {
                    cell.setAttribute("name", "cellheader");
                    cell.innerHTML = '<input name="' + this.id + '_cb" type="checkbox" >';
                    continue;
                } 
                else if(this.template.needSequence && ((!hasHeader && j == 0) || (hasHeader && j == 1)) ) {
                    cell.setAttribute("name", "sequence");
                    $(cell).html(curRow.getAttribute("_index"));
                    continue;
                }

                this.processDataCell(cell);                     
            }   
        },

        processDataCell: function(cell) {
            var colName = cell.getAttribute("name");
            var column = this.template.columnsMap[colName]; 
            if( colName == null || column == null) {
                return;
            } 

            if(column.getAttribute("highlight") == "true") {
                $(cell).addClass("highlight");
            }
            $(cell).css("text-align", getAlign(column));

            var value = cell.getAttribute("value") ;
            if(value == null) return;

            var mode  = column.getAttribute("mode") || "string";
            switch( mode ) {
                case "number": 
                case "int":  
                case "date":
                    cell.title = value;
                    break;         
                case "function":                          
                    break;    
                case "image":          
                    cell.innerHTML = "<img src='" + value + "'/>";
                    break;    
                case "boolean":      
                    var checked = (value =="true") ? "checked" : "";
                    cell.innerHTML = "<form><input class='selectHandle' type='radio' " + checked + "/></form>";
                    cell.querySelector("input").disabled = true;
                    break;
                case "string":
                default:
                    var texts = column.getAttribute("texts");
                    var values = column.getAttribute("values");
                    if(values && texts) {
                        var listNames  = texts.split("|");
                        var listValues = values.split("|");
                        listValues.each(function(n, optionValue) {
                            if(value == optionValue) {
                                value = listNames[n];
                            }
                        });
                    }
                    $(cell).html(value);
                    
                    var showTitle = column.getAttribute("showTitle");
                    if(showTitle != 'false') {
                        $(cell).title(value);  
                    }
                                            
                    break;
            }                           
        },

        /*
         * 根据页面上的行序号，获取相应的Row对象
         * 参数：  index   行序号
         * 返回值： Row对象
         */
        getRowByIndex: function(index) {
            for(var i = 0; i < this.tbody.rows.length; i++) {
                var row = this.tbody.rows[i];
                if(row.getAttribute("_index") == index) {
                    return row;
                }
            }
        },

        // 获取选中行中指定列的值
        getColumnValue: function(columnName) {
            var value;
            var rowIndex = this.gridBox.selectRowIndex; 
            if(rowIndex) {
                var row = this.getRowByIndex(rowIndex);
                $.each(row.cells, function(i, cell) {
                    if(cell.getAttribute("name") == columnName) {
                        value = cell.getAttribute("value");
                    }
                });
            }
            return value;
        },

        // 获取某一列的值
        getColumnValues: function(columnName) {
            var values = [];
            var cells = $("tr>td[name='" + columnName + "']", this.tbody);
            cells.each(function(i, cell){
                values[i] = cell.getAttribute("value");
            });

            return values;
        },

        // 新增一行
        insertRow: function(map) {
            var trList = this.gridBox.querySelectorAll("table tbody tr");
            var lastRow = trList[trList.length - 1];
            var lastRowIndex = lastRow ? parseInt(lastRow.getAttribute("_index")) : 0; 

            var newRow = this.tbody.insertRow(this.totalRowsNum ++);
            newRow.setAttribute("_index", lastRowIndex + 1);

            var thList = $("table thead td", this.gridBox);
            thList.each( function(i, th) {
                var colName = th.getAttribute("name");
                
                var cell = newRow.insertCell(i);
                cell.setAttribute( "name", colName );

                if(map[colName]) {
                    $(cell).html(map[colName]);
                    cell.setAttribute( "value", map[colName] );
                }

                if($(th).hasClass("hidden")) {
                    $(cell).addClass("hidden");
                }
            });
 
            this.processDataRow(newRow);

            bindSortHandler(this.tbody.parentNode);
        },

        // 删除单行
        deleteRow: function(row) {
            this.tbody.removeChild(row);
            this.totalRowsNum --;
        },

        deleteRowByIndex: function(rowIndex) {
            var row = this.getRowByIndex(rowIndex);
            this.deleteRow(row);

            bindSortHandler(this.tbody.parentNode);
        },

        deleteSelectedRow: function() {
            var rowIndex = this.gridBox.selectRowIndex;
            this.deleteRowByIndex(rowIndex);
            delete this.gridBox.selectRowIndex;
        },
            
        // 更新单行记录的某个属性值
        modifyRow: function(row, attrName, value) {
            var oThis = this;
            $.each(row.cells, function(i, cell) {
                if(cell.getAttribute("name") == attrName) {
                    cell.setAttribute("value", value);
                    oThis.processDataCell(cell);
                }
            });
        },

        modifyRowByIndex: function(rowIndex, attrName, value) {
            var row = this.getRowByIndex(rowIndex);
            this.modifyRow(row, attrName, value);
        },

        modifySelectedRow: function(attrName, value) {
            var rowIndex = this.gridBox.selectRowIndex;
            this.modifyRowByIndex(rowIndex, attrName, value);
        },

        getHighlightRow: function() {
            return $(".highlight", this.tbody)[0];
        },

        getCheckedRows: function() {
            return this.getCheckedRowsValue("id").join(",");
        },

        getCheckedRowsValue: function(field) {
            var result = [];
            $("input[name='grid_cb']", this.tbody).each(function(){
                if(this.checked){
                    var tr = this.parentNode.parentNode;
                    var fValue = $("td[name='" + field + "']", tr).attr("value");
                    result.push(fValue);
                }
            });
            return result;
        },

        // 添加Grid事件处理
        addGridEvent: function() {          
            var oThis = this, deltaY = 10;

            this.gridBox.onscroll = function() {
                 /* 
                  * 判断是否到达底部，需满足: scrollTop + clientHeight == scrollHeight 
                  * scrollTop：滚动条在Y轴上的滚动距离。
                  * clientHeight：内容可视区域的高度。
                  * scrollHeight：内容可视区域的高度加上溢出（滚动）的距离。
                  * 前提条件：是在向下滚动。
                  */
                var scrollDown = false;
                if(this.scrollTop > deltaY)  { // down
                    deltaY = this.scrollTop; 
                    scrollDown = true;
                } 
                if(this.scrollTop == deltaY) { } // 横向运动, scrollLeft在变
                if(this.scrollTop < deltaY)  { // up
                    deltaY = this.scrollTop; 
                }

                if( scrollDown && (this.scrollHeight - this.scrollTop <= this.clientHeight) ) {
                    var eventFirer = new $.EventFirer(oThis.el, "onScrollToBottom");
                    eventFirer.fire();
                }
            };

            this.gridBox.onmousewheel = function() {
                this.scrollTop += -Math.round(window.event.wheelDelta / 120) * cellHeight;
            };
            
            this.gridBox.onkeydown = function() {
                switch (window.event.keyCode) {
                    case 33:    //PageUp
                        oThis.gridBox.scrollTop -= oThis.pageSize * cellHeight;
                        return false;
                    case 34:    //PageDown
                        oThis.gridBox.scrollTop += oThis.pageSize * cellHeight;
                        return false;
                    case 35:    //End
                        oThis.gridBox.scrollTop = oThis.gridBox.offsetHeight - oThis.windowHeight;
                        return false;
                    case 36:    //Home
                        oThis.gridBox.scrollTop = 0;
                        return false;
                    case 37:    //Left
                        oThis.gridBox.scrollLeft -= 10;
                        return false;
                    case 38:    //Up
                        oThis.gridBox.scrollTop -= cellHeight;
                        return false;
                    case 39:    //Right
                        oThis.gridBox.scrollLeft += 10;
                        return false;
                    case 40:    //Down
                        oThis.gridBox.scrollTop += cellHeight;
                        return false;
                }
            };
         
            this.gridBox.onclick = function(ev) { // 单击行
                fireClickRowEvent(this, ev, "onClickRow");
            };

            this.gridBox.ondblclick = function(ev) { // 双击行
                fireClickRowEvent(this, ev, "onDblClickRow");
            };

            this.gridBox.oncontextmenu = function(ev) {
                fireClickRowEvent(this, ev, "onRightClickRow"); // 触发右键事件
            };

            // 触发自定义事件
            function fireClickRowEvent(gridBox, ev, firerName) {
                var _srcElement = $.Event.getSrcElement(ev);
                if( _srcElement && notOnGridHead(_srcElement) ) { // 确保点击处不在表头
                    var trObj = _srcElement;
                    while( trObj && trObj.tagName.toLowerCase() != "tr" ) {
                        trObj = trObj.parentElement;
                    }

                    if(trObj && trObj.getAttribute("_index") ) {
                        var rowIndex = parseInt( trObj.getAttribute("_index") );
                        var oEvent = $.Event.createEventObject();
                        oEvent.result = {
                            rowIndex: rowIndex,
                            ev: ev
                        };

                        gridBox.selectRowIndex = rowIndex;
                        var eventFirer = new $.EventFirer(gridBox, firerName);
                        eventFirer.fire(oEvent);  // 触发右键事件
                    }   
                }       
            }
            
            // 确保点击处不在表头
            function notOnGridHead(srcElement) { 
                return !isContainTag(srcElement, "THEAD");
            }
            
            function isContainTag(obj, tag) {
                while( obj ) {
                    if (obj.tagName == tag) {
                        return true;
                    }
                    obj = obj.parentElement;
                }
                return false;
            }
        }
    };

    return Grid;
});


;(function($){

    /*
     *  翻页工具条
     *  参数： object:pageBar      工具条对象
                XmlNode:pageInfo        XmlNode实例
                function:callback       回调函数
     */
    $.initGridToolBar = function(pageBar, pageInfo, callback) {
        pageBar.init = function() {
            this.innerHTML = ""; // 清空内容
            this.callback = callback;

            var totalpages = pageBar.getTotalPages();
            var curPage = pageBar.getCurrentPage();

            var str = [];
            str[str.length] = '<span class="button refresh" id="GridBtRefresh" title="刷新"></span>';
            str[str.length] = '<span class="button first"   id="GridBtFirst"   title="第一页"></span>';
            str[str.length] = '<span class="button prev"    id="GridBtPrev"    title="上一页"></span>';
            str[str.length] = '<span class="button next"    id="GridBtNext"    title="下一页"></span>';
            str[str.length] = '<span class="button last"    id="GridBtLast"    title="最后一页"></span>';
            
            str[str.length] = '<select id="GridPageList">';
            for(var i=1; i <= totalpages; i++) {
                str[str.length] = '  <option value="' + i + '"' + (curPage == i ? ' selected' : '') + '>' + i + '</option>';
            }
            str[str.length] = "</select>";

            this.innerHTML = str.join("");
 
            $("#GridBtRefresh").click(function() {
                var curPage = pageBar.getCurrentPage();
                pageBar.gotoPage(curPage);
            });
            $("#GridBtFirst").click(function() {
                pageBar.gotoPage("1");
            });
            $("#GridBtLast").click(function() {
                var lastpage = pageBar.getLastPage();
                pageBar.gotoPage(lastpage);
            });
            $("#GridBtNext").click(function() {
                var curPage  = pageBar.getCurrentPage();
                var lastpage = pageBar.getLastPage();
                if(curPage < lastpage) {
                    pageBar.gotoPage(curPage + 1);
                }
            });
            $("#GridBtPrev").click(function() {
                var curPage = pageBar.getCurrentPage();
                if(curPage > 1) {
                    pageBar.gotoPage(curPage - 1);
                }
            });
            $.Event.addEvent($1("GridPageList"), "change", function() {
                pageBar.gotoPage(this.value);
            });
        }
        
        pageBar.getCurrentPage = function() {
            var currentpage = pageInfo.getAttribute("currentpage");
            return currentpage ? parseInt(currentpage) : 1;
        }
        
        pageBar.getLastPage = function() {
            var lastpage = this.getTotalPages();
            return lastpage ? parseInt(lastpage) : 1;
        }
        
        pageBar.getTotalPages = function() {
            var totalpages = pageInfo.getAttribute("totalpages");
            return totalpages ? parseInt(totalpages) : 1;
        }
        
        pageBar.gotoPage = function(page) {
            if( this.callback ) {
                this.callback(page); // 转到指定页
                $1("GridPageList").value = page;
                pageInfo.setAttribute("currentpage", page);
            }
        }
        
        pageBar.init();
    };

    $.showGrid = function(serviceUrl, dataNodeName, editRowFuction, gridName, page, requestParam, pageBar) {
        pageBar  = pageBar  || $1("gridToolBar");
        gridName = gridName || "grid";
        page     = page || "1";

        var request = new $.HttpRequest();
        request.url = serviceUrl + "/" + page;
        request.params = requestParam || {};
        request.waiting = true;

        request.onresult = function() {
            var gridBox = $1(gridName);
            if(gridBox.getAttribute("height") == null) {
                gridBox.setAttribute("height", gridBox.clientHeight); // hack for IE11
            }
            
            var grid = $.G(gridName, this.getNodeValue(dataNodeName)); 
     
            var gotoPage = function(page) {
                request.url = serviceUrl + "/" + page;
                request.onresult = function() {
                    $.G(gridName, this.getNodeValue(dataNodeName)); 
                    $.initGridToolBar(pageBar, this.getNodeValue("PageInfo"), gotoPage);
                }               
                request.send();
            }

            var pageInfoNode = this.getNodeValue("PageInfo");            
            $.initGridToolBar(pageBar, pageInfoNode, gotoPage);
            
            gridBox.onDblClickRow = function(evObj) {
                editRowFuction();
            }
            gridBox.onRightClickRow = function(evObj) {
                var ev = evObj.result.ev || window.event;
                gridBox.contextmenu.show(ev.clientX, ev.clientY);
            }   
            gridBox.onScrollToBottom = function () {           
                var currentPage = pageBar.getCurrentPage();
                if(pageBar.getTotalPages() <= currentPage) return;

                var nextPage = parseInt(currentPage) + 1; 
                request.url = serviceUrl + "/" + nextPage;
                request.onresult = function() {
                    $.G(gridName).load(this.getNodeValue(dataNodeName), true);

                    var pageInfoNode = this.getNodeValue("PageInfo");
                    $.initGridToolBar(pageBar, pageInfoNode, gotoPage);
                }               
                request.send();
            }
        }
        request.send();
    };

    // 删除选中Grid行
    $.delGridRow = function(url, gridName) {
        if( !confirm("您确定要删除该行记录吗？") ) return;
        
        var grid = $.G(gridName || "grid");
        var objectID = grid.getColumnValue("id");
        if( objectID ) {
            $.ajax({
                url : url + objectID,
                method : "DELETE",
                onsuccess : function() { 
                    grid.deleteSelectedRow();
                }
            }); 
        }
    }

})(tssJS);