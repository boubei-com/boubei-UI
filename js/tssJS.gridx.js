;(function ($, factory) {

    $.DataGrid = factory();

    var DataGridCache = {};

    $.fn.extend({
    	datagrid: function(info) {
    		var el = this[0];
    		var id = el.id;
	        var grid = DataGridCache[id];
	        if( grid == null || info.data ) {
	            grid = new $.DataGrid(el, info);
	            DataGridCache[id] = grid;  
	        }
	        
	        return grid;
	    }
    });

    $.extend({
        formatMoney: function(s, n) {   
            n = n > 0 && n <= 20 ? n : 2;   
            s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";   
            var l = s.split(".")[0].split("").reverse(),   
            r = s.split(".")[1];   
            t = "";   
            for(i = 0; i < l.length; i ++ ) {   
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");   
            }   
            return t.split("").reverse().join("") + "." + r;   
        },

        numberValidator: function(value) {
            var re = /^-?[0-9]+.?[0-9]*$/;
            return re.test(value);
        }
    });

})(tssJS, function() {

    'use strict';

    var Column = function(info) {
		this.name  = info.name;
		this.label = info.label|| info.name;
		this.type  = info.type || "string";
		this.width = (info.width || "120px").trim();
		this.align = info.align;
		this.formatter = info.formatter;
		this.styler = info.styler;
		this.editable = info.editable || "false";

		if( /^\d*$/.test(this.width) ) {
			this.width += "px";
		}
 
		switch(this.type) {
        case "number":
            this.align = this.align || "right";
            this.validator = this.validator || $.numberValidator;
            break;
        case "string":
        default:
            this.align = this.align || "center";
             break;
   	 	}		
    };

    var DataGrid = function(el, info) {
    	this.el = el;
    	$(this.el).html("").css("width", info.width || "100%");

    	var pointHeight = info.height;
        if( pointHeight == null ) {
            pointHeight = this.el.clientHeight || this.el.parentNode.clientHeight; 
        }
        $(this.el).css("height", pointHeight + "px"); // hack 固定住grid高度，以免在IE部分版本及FF里被撑开

    	// Grid控件上禁用默认右键
        (this.el.parentNode || document).oncontextmenu = function(_event) {
            $.Event.cancel(_event || window.event);
        }

		var _columns = {};
        (info.columns || []).each(function(index, column) {
            _columns[column.name] = new Column(column);
        });
        this.columns = _columns;

        // 样式 和 事件
        this.rowStyler = info.rowStyler;
        this.afterEditCell = info.afterEditCell;

        this.url = info.url;
        this.queryParams = info.queryParams;
        if(this.url) {
        	var oThis = this;
        	$.ajax({
        		url: oThis.url,
        		params: oThis.queryParams,
        		type: "json",
        		waiting: true,
        		ondata: function() {
        			oThis.data = this.getResponseJSON();
        			oThis.createGrid();
        		}
        	});
        }
        else {
        	this.data = this.el.data = info.data;
        	this.createGrid();
        }
    };

    DataGrid.prototype = {
        createGrid: function() {
            this.toHTML();

            // 渲染样式 styler rowStyler
            this.appendStyle();

            // 添加事件、动作
            this.addEvent();
        },

    	toHTML: function() {
    		var htmls = [], thead = [], tbody = [];

    		thead.push('<thead><tr>');
    		$.each(this.columns, function(name, column) {
                var width   = column.width;
                var style = (width ? ' style="width:' + width + '"': '');
                thead.push('<td name="' + column.name + '" ' + style + '>' + column.label + '</td>');
            });
            thead.push("</tr></thead>");

            var oThis = this;
            tbody.push('<tbody>');
            $.each(oThis.data, function(i, row) {
                var index = i + 1;
                tbody.push('<tr _index="' + index + '">');

                $.each(oThis.columns, function(name, column) {
                    var value  = row[name] || "";
                    tbody.push('<td><div name="' + name + '" contenteditable="' + column.editable + '" ' + '>' + value + '</div></td>');
                });

                tbody.push("</tr>");
            });
            tbody.push("</tbody>");

            htmls.push("<table>");
            htmls.push(thead.join(""));
            htmls.push(tbody.join(""));
            htmls.push("</table>");

            $(this.el).html( htmls.join("") ).addClass("datagrid");
    	},

        appendStyle: function() {
            var oThis = this;
            $("tbody>tr", this.el).each(function(i, row){
                row.data = oThis.data[i];
                if( $.isFunction(oThis.rowStyler) ) {
                    oThis.rowStyler(i, row);
                }

                $(row).hover(
                    function() { $(row).addClass("highlight"); }, 
                    function() { $(row).removeClass("highlight"); } 
                );

                $("td>div", row).each(function(j, cellDiv){
                    var $cell= $(cellDiv);
                    var name = $cell.attr("name");

                    var column = oThis.columns[name];
                    if( $.isFunction(column.styler) ) {
                        column.styler(row.data[name], cellDiv);
                    }

                    if(column.align) {
                        $cell.css("textAlign", column.align);
                    }

                    if( $.isFunction(column.formatter) ) {
                        var value = $cell.html();
                        $cell.html( column.formatter(value, row) );
                    }
                });
            });
        },

        addEvent: function() {
            var oThis = this;
            $("tbody>tr", this.el).each(function(i, row){
                $("td>div", row).each(function(j, cellDiv){
                    var $cell = $(cellDiv);
                    var name = $cell.attr("name");
                    var column = oThis.columns[name];

                    if($cell.attr("contenteditable") === "true") {
                        $cell.click(function(){
                            var originalVal = row.data[name];
                            $cell.html(originalVal);

                            $cell[0].blurHandler = $cell[0].blurHandler || function() {
                                var value = $cell.html(); 
                                
                                // 如果不合格式，则置会修改前的值
                                if( $.isFunction(column.validator) && !column.validator(value, row) ) {
                                    $cell.notice("新输入的值【" + value + "】不符合格式要求");
                                    $cell.html( column.formatter(originalVal, row) );
                                    return;
                                }

                                row.data[name] = value;
                                if( $.isFunction(column.formatter) ) {
                                    $cell.html( column.formatter(value, row) );
                                }

                                if( $.isFunction(oThis.afterEditCell) ) {
                                    oThis.afterEditCell(value, cellDiv, row);
                                }
                            };
  
                            $cell.blur($cell[0].blurHandler);
                        });                        
                    }
                });
            });
        },

        appendRow: function(rowData) {

        },

        deleteRow: function(rowIndex) {

        }
    }

    return DataGrid;

});