/* Form组件 */
;(function ($, factory) {

    $.Form = factory($);

    var FormCache = {};

    $.F = function(id, data) {
        var form = FormCache[id];
        if( form == null && data == null ) {
            return null;
        }

        if( form == null || data ) {
            form = new $.Form($1(id));
            FormCache[form.id] = form;  

            form.load(data)
        }
        
        return form;
    };

    $.fn.extend({
        form: function(data) {
            if(this.length > 0) {
                return $.F(this[0].id, data);
            }
        }
    });

})(tssJS, function ($) {

    'use strict';

    var showErrorInfo = function(errorMsg, obj) {
        setTimeout(function() {
            if( $.Balloon ) {
                $(obj).notice(errorMsg);
            }
        }, 100);
    },

    setFocus = function(){
        try { this.el.focus(); } catch(e) { }
    },

    validate = function() {
        var name     = this.el.getAttribute("id");
        var empty    = this.el.getAttribute("empty");
        var caption  = (this.el.getAttribute("caption")||"").replace(/\s/g, "");
        var checkReg = this.el.getAttribute("checkReg") || this.el.getAttribute("inputReg");
        
        var errorMsg = "";
        var value = this.form ? this.form.getData(name) : this.el.value;
        if(!value && this.el.value && this.tree) {
            errorMsg = "[" + caption + "]手输无效，要求必须选中不少于一个下拉节点。";
        }

        if( !value && empty == "false") {
            errorMsg += "[" + caption + "] 不允许为空。";
        }
        else if(checkReg && value && !(new RegExp(checkReg)).test(value)) {
            errorMsg = this.el.getAttribute("errorMsg");
            errorMsg = errorMsg || "[" + caption + "] 格式不正确，请更正.";
        }

        if( errorMsg ) {
            showErrorInfo(errorMsg, this.el);

            if( !!this.isInstance ) {
                this.setFocus();
            }

            $.Event.cancel();
            return false;
        }
        return true;
    },

    value2List = function(value) {
        var valueList = {};
        if( !$.isNullOrEmpty(value) ) {
            value.split(",").each(function(i, item){
                valueList[item] = true;
            })
        }           
        return valueList;
    },

    createFieldObj = function(field, $el) {
        var fieldObj;
        var fieldType = field.getAttribute("mode");
        switch(fieldType) {
            case "number":
                fieldObj = new StringField($el, this);
                break;
            case "date":
            case "function":
            case "datetime":
                fieldObj = new FunctionField($el, this, fieldType === "datetime");
                break;
            case "hidden":
                fieldObj = new HiddenFiled($el, this);
                break;
            case "combo":
                fieldObj = new ComboField($el, this);
                break;
            case "combotree":
                fieldObj = new ComboTreeField($el, this);
                break;
            case "string":
            default:
                fieldObj = new StringField($el, this);
                break;
        }
        return fieldObj;
    },

    fireOnChangeEvent = function(el, newValue) {
        var onchangeFunc = el.getAttribute("onchange");
        if(onchangeFunc) {
            onchangeFunc = onchangeFunc.replace(/\^/g, "'"); // 有些地方的配置無法直接使用引号（如JSON），用^代替，這裡替換回來
            var rightKH = onchangeFunc.indexOf(")");
            if(rightKH > 0) {
                onchangeFunc = onchangeFunc.substring(0, rightKH) + ", '" + newValue + "')"; 
            }
            else {
                onchangeFunc = onchangeFunc + "('" + newValue + "')";
            }

            eval(onchangeFunc);
        }
    },

    XMLTemplate = function(dataXML) {
        this.sourceXML = dataXML;
             
        this.declare = $("xform>declare", dataXML)[0];
        this.layout  = $("xform>layout", dataXML)[0]; 
        this.script  = $("xform>script", dataXML)[0];
    
        this.dataNode =  $("xform>data", dataXML)[0];
        if(this.dataNode == null) {             
            this.dataNode = $.XML.createNode("data");
            this.sourceXML.appendChild(this.dataNode);
        }
        
        this.rowNode = $("row", this.dataNode)[0];;
        if(this.rowNode == null) {
            this.rowNode = $.XML.createNode("row");
            this.dataNode.appendChild(this.rowNode);    
        }
        
        var oThis = this;
        this.fieldsMap = {};
        $("column", this.declare).each( function(i, column) {
            oThis.fieldsMap[column.getAttribute("name")] = column;
        } );
    };

    XMLTemplate.prototype = {

        /* 获取row节点上与column对应的值 */
        getFieldValue: function(name) {
            var node = this.rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node ) {
                return $.XML.getText(node).convertEntry();
            }
            return null;
        },

        toHTML: function() {
            var htmls = [], oThis = this;
            htmls.push("<form class='tssForm' method='post' onsubmit='return false;' autocomplete='off'>");
            htmls.push('<table>');

            // 添加隐藏字段           
            $("column[mode='hidden']", this.declare).each( function(i, column){
                var name = column.getAttribute("name");
                var value = oThis.getFieldValue(name);
                value = value ? "value=\"" + value + "\"" : "";
                htmls.push('<input type="hidden" ' + value + ' id="' + name + '"/>');
            } );
            htmls.push('<input type="hidden" name="xml" id="xml"/>');

            var trList = this.layout.querySelectorAll("TR");
            for(var i=0; i < trList.length; i++) {
                var trNode = trList[i];
                htmls.push("<tr>");

                var tdList = trNode.querySelectorAll("TD");
                for(var j=0; j < tdList.length; j++) {
                    var tdNode = tdList[j];
                    htmls.push("<td "+ copyNodeAttribute(tdNode) +">");

                    var childNodes = tdNode.childNodes;
                    for(var n=0; n < childNodes.length; n++) {
                        var childNode = childNodes[n];
                        if(childNode.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                            htmls.push(childNode.value);
                            continue;
                        }

                        var binding = childNode.getAttribute("binding");
                        var column = this.fieldsMap[binding];
                        if(column == null) {
                            htmls.push($.XML.toXml(childNode));
                            continue;
                        }

                        var mode    = column.getAttribute("mode") || 'string';
                        var caption = column.getAttribute("caption");
                        var value   = this.getFieldValue(binding);
                        var _value  = (value ? " value=\"" + value + "\"" : " ");
                        
                        var nodeName = childNode.nodeName.toLowerCase(); // label、input、textarea等 
                        if(nodeName == "label" && binding && binding != "") {
                            htmls.push("<label id='label_" + binding + "'>" + caption + "</label>");
                        }
                        else if(mode == 'combo') {
                            htmls.push("<select " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + "></select>");
                        }
                        else if(mode == "string" && nodeName == 'textarea') {
                            htmls.push("<textarea " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + " spellcheck='false'>" + (value ? value : "") + "</textarea>");
                        }
                        else if(mode == "string" || mode == "number" || mode == "function" || mode == "date" || mode == "datetime" || mode == "combotree") {
                            htmls.push("<input " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + " spellcheck='false'></input>");
                        }
                    }
                    htmls.push("</td>");
                }   
                htmls.push("</tr>");
             }

             htmls.push("</table>");
             htmls.push("</form>");
             return htmls.join("");

             // some private function define
             function copyColumnAttribute(column) {
                var returnVal = " ";
                $.each(column.attributes, function(i, attr){
                    var name  = attr.nodeName;
                    var value = attr.value;
                    if(value && value != "null") {
                        if(name == "name") {
                            name = "id";
                        }
                        returnVal += name + " = \"" + value + "\" ";
                    }
                } );
 
                return returnVal;
             }

             function copyNodeAttribute(node) {
                var returnVal = "";
                var hasBinding = node.getAttribute("binding") != null;
                $.each(node.attributes, function(i, attr){
                    if(attr.nodeName != "style" || !hasBinding) {
                        returnVal += attr.nodeName + "=\"" + attr.value + "\" ";
                    }
                    if(attr.nodeName == "style" && hasBinding) {
                        returnVal += "style=\"" + attr.value + "\" ";
                    }
                } );
                return returnVal;
             }
        }
    };
 
    var Form = function(element) {
        this.id  = element.id;
        this.box = element;

        this.editable = element.getAttribute("editable") || "true";
        this.fieldObjMap = {};
    };

    Form.prototype = {

        load: function(dataXML) {
            if("object" != typeof(dataXML) || dataXML.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                return $.alert("传入的Form数据有问题，请检查。");
            }
            
            this.template = new XMLTemplate(dataXML);   
            this.box.innerHTML = this.template.toHTML(); 

            // 绑定各个字段输入框对应的编辑方式
            this.attachEditor();

            // 添加tssForm定制的script
            if(this.template.script) {
                $.createScript($.XML.getText(this.template.script));
            }
        
            // 绑定事件
            this.box.onselectstart = function(ev) {
                $.Event.cancelBubble(ev); // 拖动选择事件取消冒泡
            }

            var form = this.box.querySelector("form");
            if(form) {
                $.Event.addEvent(form, "submit", this.checkForm);
            }   

            $(".fullscreenable", form).each(function(i, el){
                $(el).fullscreen();
            })
        },
 
        attachEditor: function() {
            var fieldsMap = this.template.fieldsMap;
            for(var fieldName in fieldsMap) {
                var field = fieldsMap[fieldName];

                // 取layout中绑定该field column的element，如无，则字段无需展示。
                var el = $1(fieldName);
                if( !el )  continue;

                this.fieldObjMap[fieldName] = createFieldObj.call(this, field, $(el));

                if(field.getAttribute('empty') == "false") {
                    var requiredTag = $.createElement("span", "required");
                    $(requiredTag).html("*");
                    el.parentNode.appendChild(requiredTag);
                }
            }

            this.setEditable();
        },
 
        checkForm: function() {
            for(var fieldName in this.fieldObjMap) {
                var fieldObj = this.fieldObjMap[fieldName];
                if( !fieldObj.validate() ) {
                    return false;
                }
            }

            $$("xml").value = $.XML.toXml(this.template.dataNode);
            return true;
        },

        setEditable: function(status) {
            status = status || this.editable;

            $(".buttonBox", this.box.parentNode).css("display", status == "true" ? "block": "none");

            var oThis = this, firstEditableField;
            $.each(this.fieldObjMap, function(name, fieldObj) {
                var _status = status;

                // 如果field column上默认定义为不可编辑，则永远不可编辑
                var mode = oThis.getFieldConfig(name, "mode");
                var editable = oThis.getFieldConfig(name, "editable");
                if ( editable == "false" ) {
                    _status = "false";
                } 
                fieldObj.setEditable(_status);

                if( !firstEditableField && _status == "true" && mode == "string") {
                    firstEditableField = fieldObj;
                }               
            });

            if(firstEditableField) {
                firstEditableField.setFocus();
            }
        },

        setFieldEditable: function(name, value) {
            var fieldObj = this.fieldObjMap[name];
            if( fieldObj ) {
                fieldObj.setEditable(value);
            }
        },

        /* 设置row节点上与field column对应的值 */
        setFieldValue: function(name, value) {
            var rowNode = this.template.rowNode;
            var node = rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node == null ) { 
                rowNode.appendChild(node = $.XML.createNode(name)); // 创建单值节点
            }

            var CDATANode = node.firstChild;
            if( CDATANode == null ) {
                node.appendChild(CDATANode = $.XML.createCDATA(value));
            } else {
                $.XML.setText(CDATANode, value);
            }

            var eventOndatachange = new $.EventFirer(this, "ondatachange");
            var ev = $.Event.createEventObject();
            ev.id = this.id + "_" + name;
            eventOndatachange.fire(ev);  // 触发事件
        },

        // 将界面数据更新到Form模板的data/row/里
        updateData: function(el) {
            var newValue;
            var ev = window.event;
            if(ev && ev.propertyName == "checked") {
                newValue = el.checked == true ? 1 : 0;
            }
            else if(el.tagName.toLowerCase() == "select") {
                newValue = el._value;            
            }
            else {
                newValue = el.value;
            }

            var oldValue = this.getData(el.id);
            if( $.isNullOrEmpty(newValue) && $.isNullOrEmpty(oldValue) ) {
                return;
            }
            if(newValue != oldValue) {
                this.setFieldValue(el.id, newValue);
            }
        },

        // 将数据设置到界面输入框上显示，同时更新到data/row/里
        updateDataExternal: function(name, value) {
            this.setFieldValue(name, value);
            
            // 更改页面显示数据
            var fieldObj = this.fieldObjMap[name];
            if(fieldObj) {
                fieldObj.setValue(value);
            }
        },

        getData: function(name) {
            return this.template.getFieldValue(name);
        },

        showCustomErrorInfo: function(name, str) {
            var fieldObj = this.fieldObjMap[name];
            if( fieldObj ) {
                showErrorInfo(str, fieldObj.el);
            }
        },

        getFieldConfig: function(name, attrName) {
            var field = this.template.fieldsMap[name];
            if( field == null ) {
                return $.alert("指定的字段[" + name + "]不存在");
            }
            return field.getAttribute(attrName);
        },

        /* 示例：动态更新下拉树：
            form.updateField("center2", [
                        {"name": "mode", "value": "combotree"},
                        {"name": "texts", "value": texts.join('|')},
                        {"name": "values", "value": values.join('|')}
                     ]) */
        updateField: function(name, attrs) {
            var field = this.template.fieldsMap[name];
            if(!field) {
                field = this.template.fieldsMap[name.replace('p_', '')]; // recorder.html的查询form在字段前加了p_
            }
            if( field ) {
                var $el = $($1(name));
                $.each(attrs, function(i, attr) {
                    $(field).attr(attr.name, attr.value);
                    $el.attr(attr.name, attr.value);
                });

                var fieldObj = createFieldObj.call(this, field, $el);
                this.fieldObjMap[name] = fieldObj;

                fieldObj.refresh && fieldObj.refresh();
            }
        },

        getXmlDocument: function() {
            return this.template.sourceXML;
        }
    };

    // 普通文本输入框
    var StringField = function($el, form) {
        this.el = $el[0];
        this.el._value = this.el.value; // 备份原值

        var oThis = this;
        this.el.onblur = function() {
            if("text" == this.type) { // 判断input的类型
                this.value = this.value.trim(); // 去掉前后的空格
            }
            form.updateData(this);
        };
    };

    StringField.prototype = {
        setValue : function(value) {
            this.el._value = this.el.value = value;
        },

        validate: validate,
        
        setEditable : function(status) {
            this.el.editable = status || $(this.el).attr("editable");

            var disabled = (this.el.editable == "false");
            $(this.el).addClass( disabled ? "field_disabled" : "string" );

            if(this.el.tagName == "textarea") {
                this.el.readOnly = disabled;  // textarea 禁止状态无法滚动显示所有内容，所以改为只读
            } else {
                this.el.disabled = disabled;        
            }
        },
 
        setFocus : setFocus
    };

    // 自定义方法输入值类型
    var FunctionField = function($el, form, isDatetime) {
        this.el = $el[0];
        this.el._value = this.el.value; // 备份原值
        this.isdate = ($el.attr("mode").toLowerCase() == "date") || isDatetime;
     
        if( !this.el.disabled ) {
            if(this.isdate) {
                if(this.picker == null) {
                    this.picker = new $.Calendar( {
                        field: $1(this.el.id),
                        firstDay: 1,
                        minDate: new Date('2000-01-01'),
                        maxDate: new Date('2030-12-31'),
                        yearRange: [2000,2030],
                        format: 'yyyy-MM-dd',
                        careTime: isDatetime
                    });
                }
            }
            else { 
                var funcIcon = $.createElement("span", "functionBt"); // 添加点击按钮
                if(this.el.nextSibling) {
                    this.el.parentNode.insertBefore(funcIcon, this.el.nextSibling);
                } else {
                    this.el.parentNode.appendChild(funcIcon);
                }               
 
                var cmd = $el.attr("cmd");
                funcIcon.onclick = function() {
                    $.execCommand(cmd);
                };
            }
        }   

        this.el.onblur = function() {
            form.updateData(this);
        };
    };
 
    FunctionField.prototype = {
        setValue : function(value) {
            this.el._value = this.el.value = value;
        },

        validate: validate,
        
        setEditable : function(status) {
            this.el.disabled  = (status == "false");
            this.el.className = (this.el.disabled ? "field_disabled" : "function");

            // function图标
            if(!this.isdate) {
                this.el.nextSibling.className = (this.el.disabled ? "hidden" : "functionBt");
                this.el.readOnly = true;
            }
            
            this.el.editable = status;
        },
 
        setFocus : setFocus
    };

    // 下拉选择框，单选或多选
    var ComboField = function($el, form) {
        this.el = $el[0];
        this.multiple = $el.attr("multiple") != null;
        this.required = $el.attr('empty') == "false";

        var valueList = ($el.attr("values") || "").trim();
        var textList  = ($el.attr("texts")  || "").trim();   
        
        var valueNode = this.el.attributes["value"];
        this.el._value = valueNode ? valueNode.value : "";

        var selectedValues = value2List(this.el._value);

        // 加一个空白的选项
        if(!this.required) {
            valueList = ("|" + valueList);
            textList = ("|" + textList);
        }
        valueList = valueList.length > 1 ? valueList.split('|') : [];
        textList  = textList.length > 1 ? textList.split('|') : [];
        this.el.options.length = 0; // 先清空
        for(var i=0; i < valueList.length; i++) {
            var value = valueList[i];
            this.el.options[i] = new Option(textList[i], value);
     
            if( selectedValues[value] ) {
                this.el.options[i].selected = true;
            }
        }

        if(this.multiple && $el.attr("height") == null) {
            $el.css("height", Math.min(Math.max(valueList.length, 4), 4) * 18 + "px");
        }   

        // 当empty = false(表示不允许为空)时，下拉列表的默认值自动取第一项值
        if( this.required ) {
            var oldVal = this.el._value; 

            // 原值为空，或当前的下拉列表已经不包含原值，则重新设值
            if( !oldVal || (valueList.length && !valueList.contains(oldVal)) ) {
                this.setValue(valueList[0]);
                form.setFieldValue(this.el.id, valueList[0]);
            }            
        }
        
        this.el.onchange = function() {
            var x = [];
            for(var i=0; i < this.options.length; i++) {
                var option = this.options[i];
                if(option.selected) {
                    x[x.length] = option.value;
                }
            }
            this._value = x.join(",");
            form.updateData(this);
            
            fireOnChangeEvent(this, this._value);
        }
    };

    ComboField.prototype = {
        setValue: function(value) {
            var valueList = value2List(value);

            $.each(this.el.options, function(i, option){
                if(valueList[option.value]) {
                    option.selected = true;
                }
            });

            this.el._value = value;
            fireOnChangeEvent(this.el, value);
        },

        setEditable: function(status) {
            this.el.disabled  = (status == "true" ? false : true);
            this.el.className = (status == "true" ? "combo" : "field_disabled");
            this.el.editable  = status;
        },

        validate: validate,

        setFocus: setFocus
    };

    var ComboTreeField = function($el, form) {
        this.form = form;
        this.el = $el[0];
        this.multiple = $el.attr("multiple") != null;
        
        var treeEl;
        if( !this.el.treeEl ) {
            var treeEl = $.createElement("Tree", "comboTree", $.getUniqueID("comboTree"));
            document.body.appendChild(treeEl);
            this.el.treeEl = treeEl;
        } else {
            treeEl = this.el.treeEl;
        }
        
        if(this.multiple) {
            $(treeEl).attr("treeType", "multi");
        } 

        var oThis = this;
        this.load = function() {
            var valueList = ($el.attr("values") || "").split('|');
            var textList  = ($el.attr("texts")  || "").split('|');
            this.height = Math.max(3, Math.min(valueList.length, 10)) * 18 + "px";

            this.nodesData = [];
            for(var i=0; i < valueList.length; i++) {
                this.nodesData.push( {"id": valueList[i], "name": textList[i], })
            }

            this.tree = $(treeEl).tree(this.nodesData); 
            this.tree.onTreeNodeActived = onSelectNode;
            this.tree.onTreeNodeChecked = onSelectNode;

            var valueNode = this.el.attributes["value"];
            this.el._value = valueNode ? valueNode.value : "";
            var texts;
            if(this.el._value) {
                if(this.multiple) {
                    this.tree.setCheckValues(this.el._value, true);
                    texts = this.tree.getCheckedIds(false, "name");
                } else {
                    this.tree.setActiveTreeNode(this.el._value);
                    texts = this.tree.getActiveTreeNodeName();
                }
            }
            this.el.value = texts || "";
        }
        this.load();

        this.position = function() {
            var elPosition = $.absPosition(this.el);
            $(treeEl).position(elPosition.left, elPosition.bottom).hide();
            $(treeEl).css("height", this.height).css("width", $.getStyle(this.el, "width"));
        }
        this.position();

        // 控制mousedown事件，使的在树节点上点击时，下拉框不会消失（不加的话一点击this.el的obblur会被触发）
        $.Event.addEvent(this.tree.el, 'mousedown', function(e) {
            e = e || window.event;
            $.Event.cancel(e);
        }, true);

        this.el.onblur = function() {
            $(oThis.tree.el).hide();
        };

        this.el.onfocus = function() {
            oThis.position();
            $(oThis.tree.el).show();
        };

        this.el.onclick = function() {
            oThis.position();
            $(oThis.tree.el).show();
        };

        this.el.oninput = function() {
            // 自动过滤树节点
            var temp = [], inputVal = this.value;
            oThis.nodesData.each(function(i, nodeData){
                inputVal.split(",").each(function(i, item) {
                    if(nodeData.name.indexOf(item) >=0 && !temp.contains(nodeData)) {
                        temp.push(nodeData);
                    }
                });
            });
            oThis.tree = $(treeEl).tree(temp); 
            oThis.tree.onTreeNodeActived = onSelectNode;
            oThis.tree.onTreeNodeChecked = onSelectNode;

            // 如果删空了，则清除已经选中的值
            if( $.isNullOrEmpty(inputVal) ) {
                oThis.setValue(inputVal);
                form.setFieldValue(oThis.el.id, inputVal);
            }
        };

        function onSelectNode(event) {
            if(oThis.multiple) {
                var value = oThis.setValue();
                form.setFieldValue(oThis.el.id, value);
            }
            else {
                $(treeEl).hide();

                var selectedNodeId = event.node.id;
                oThis.setValue(selectedNodeId);
                form.setFieldValue(oThis.el.id, selectedNodeId);
            }
        }

        this.tree.onTreeNodeActived = onSelectNode;
        this.tree.onTreeNodeChecked = onSelectNode;
    };

    ComboTreeField.prototype = {
        // 下拉多选树是勾选，不会传入value值，需要直接去取已经选中的树节点
        setValue: function(value) {
            var text;
            if(this.multiple) {
                if(value) {                   
                    this.tree.setCheckValues(value.split(','), true);
                }
                else {
                    value = this.tree.getCheckedIds(false);
                }
                text = this.tree.getCheckedIds(false, "name");
            } 
            else {
                this.tree.setActiveTreeNode(value);
                text = this.tree.getActiveTreeNodeName();
            }

            this.el.value = text || "";
            this.el._value = value || "";
            fireOnChangeEvent(this.el, value);

            return value;
        },

        setEditable: function(status) {
            this.el.editable  = status;
            this.el.disabled  = (status == "true" ? false : true);
            this.el.className = this.el.disabled ? "field_disabled" : "combo";
        },

        validate: validate,
        setFocus: setFocus,

        refresh: function() {
            this.load();
        }
    };
 
    // 隐藏hidden字段
    var HiddenFiled = function($el, form) {
        this.el = $el[0];
    };

    HiddenFiled.prototype = {
        setValue: function(s) {},
        setEditable: function(s) {},
        validate: function() { return true; },
        setFocus: function() {}
    };

    return Form;
});