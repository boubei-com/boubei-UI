

/* 日期时间选择控件 */
;(function ($, factory) {

    $.Calendar = factory($);

    $.createCalendar = function(el, careTime) {
        $(el).calendar({
            format: 'yyyy-MM-dd',
            careTime: careTime || false
        });
    };

    $.fn.extend({
        calendar: function(inits) {
            if(this.length > 0) {
                inits = inits || {};
                inits.field = this[0];

                return new $.Calendar( inits );
            }
        }
    });

})(tssJS, function ($) {
    
    'use strict';

    var  document = window.document,
 
    isDate = function(obj) {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    string2Date = function(_s) {
        var d = new Date(Date.parse(_s.replace(/-/g, "/"))); // Date.parse in IE only support yyyy/mm/dd
        return d;
    },

    isLeapYear = function(year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function(year, month) {
        return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    getSelectdTime = function($ranges) {
        if($ranges == null || $ranges.length < 3) return "00:00:00";

        var _hour   = $ranges[0].value;
        var _minute = $ranges[1].value;
        var _second = $ranges[2].value;
        _hour = _hour.length == 1 ? "0" + _hour : _hour;
        _minute = _minute.length == 1 ? "0" + _minute : _minute;
        _second = _second.length == 1 ? "0" + _second : _second;

        return _hour + ":" + _minute + ":" + _second;
    },

    setSelectdTime = function($ranges, self) {
        $ranges[0].value = self._hour || 0;
        $ranges[1].value = self._minute || 0;
        $ranges[2].value = self._second || 0;

        $('.timeAera .range1', self.el).html( self._hour || '00');
        $('.timeAera .range2', self.el).html( self._minute || '00');
        $('.timeAera .range3', self.el).html( self._second || '00');
    },

    setToStartOfDay = function(date) {
        if ( isDate(date) )  date.setHours(0, 0, 0, 0); // 对时分秒进行清零
    },

    compareDates = function(a, b) {
        return a.format('yyyy-MM-dd') === b.format('yyyy-MM-dd');
    },

    extend = function(to, from, overwrite) {
        var prop, hasProp;
        for (prop in from) {
            hasProp = to[prop] !== undefined;
            if (hasProp && typeof from[prop] === 'object' && from[prop].nodeName === undefined) {
                if (isDate(from[prop])) {
                    if (overwrite) {
                        to[prop] = new Date(from[prop].getTime());
                    }
                }
                else if ($.isArray(from[prop])) {
                    if (overwrite) {
                        to[prop] = from[prop].slice(0);
                    }
                } else {
                    to[prop] = extend({}, from[prop], overwrite);
                }
            } else if (overwrite || !hasProp) {
                to[prop] = from[prop];
            }
        }
        return to;
    },

    /** defaults and localisation */
    defaults = {

        // bind the picker to a form field
        field: null,
 
        // position of the datepicker, relative to the field (default to bottom & left)
        position: 'bottom left',

        // the default output format for `.toString()` and `field` value
        format: 'yyyy-MM-dd',

        // hh:mi:ss
        careTime: false,

        // the initial date to view when first opened
        defaultDate: null,

        // make the `defaultDate` the initial selected value
        setDefaultDate: false,

        // first day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // the minimum/maximum date that can be selected
        minDate: null,
        maxDate: null,

        // number of years either side, or array of upper/lower range
        yearRange: 10,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        // Additional text to append to the year in the calendar title
        yearSuffix: '',

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // internationalization
        i18n: {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['日','一','二','三','四','五','六']
        },

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function(opts, day, abbr) {
        day += opts.firstDay;
        while (day >= 7) {
            day -= 7;
        }
        return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function(i, isSelected, isToday, isDisabled, isEmpty) {
        if (isEmpty) {
            return '<td class="is-empty"></td>';
        }
        var arr = [];
        if (isDisabled) {
            arr.push('is-disabled');
        }
        if (isToday) {
            arr.push('is-today');
        }
        if (isSelected) {
            arr.push('is-selected');
        }
        return '<td data-day="' + i + '" class="' + arr.join(' ') + '"><button class="pika-button" type="button">' + i + '</button>' + '</td>';
    },

    renderRow = function(days) {
        return '<tr>' + days.join('') + '</tr>';
    },

    renderBody = function(rows) {
        return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = function(opts) {
        var i, arr = [];
        for (i = 0; i < 7; i++) {
            arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
        }
        return '<thead>' + arr.join('') + '</thead>';
    },

    renderTitle = function(instance) {
        var i, j, arr,
            opts  = instance._o,
            month = instance._m,
            year  = instance._y,
            isMinYear = year === opts.minYear,
            isMaxYear = year === opts.maxYear,
            html = '<div class="pika-title">',
            monthHtml,
            yearHtml,
            prev = true,
            next = true;

        for (arr = [], i = 0; i < 12; i++) {
            arr.push('<option value="' + i + '"' + (i === month ? ' selected': '') +
                ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled' : '') + '>' +
                opts.i18n.months[i] + '</option>');
        }
        monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month">' + arr.join('') + '</select></div>';

        if ($.isArray(opts.yearRange)) {
            i = opts.yearRange[0];
            j = opts.yearRange[1] + 1;
        } else {
            i = year - opts.yearRange;
            j = 1 + year + opts.yearRange;
        }

        for (arr = []; i < j && i <= opts.maxYear; i++) {
            if (i >= opts.minYear) {
                arr.push('<option value="' + i + '"' + (i === year ? ' selected': '') + '>' + (i) + '</option>');
            }
        }
        yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year">' + arr.join('') + '</select></div>';

        if (opts.showMonthAfterYear) {
            html += yearHtml + monthHtml;
        } else {
            html += monthHtml + yearHtml;
        }

        if (isMinYear && (month === 0 || opts.minMonth >= month)) {
            prev = false;
        }

        if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
            next = false;
        }

        html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
        html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';

        return html += '</div>';
    },

    renderTable = function(opts, data) {
        return '<table class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },

    renderTime = function(opts, time) {
        var html = [];
        html.push('<div class="timeAera">');
        html.push('时：<input type="range" min="0" max="23" value="0" step="1" onchange="$(\'.range1\', this.parentNode).html(this.value);" /><span class="range1">00</span><br/>');
        html.push('分：<input type="range" min="0" max="59" value="0" step="1" onchange="$(\'.range2\', this.parentNode).html(this.value);" /><span class="range2">00</span><br/>');
        html.push('秒：<input type="range" min="0" max="59" value="0" step="1" onchange="$(\'.range3\', this.parentNode).html(this.value);" /><span class="range3">00</span><br/>');
        html.push('<button type="button">确定</button>');
        html.push('</div>');
        return html.join("\n");
    },


    /**  JCalendar constructor */
    JCalendar = function(options) {
        var self = this,
            opts = self.config(options);

        self._onMouseDown = function(e) {
            if (!self._v)  return;

            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) return;

            if ( target.parentNode && $.hasClass(target.parentNode, 'timeAera') ) {
                self._c = true;
                return;
            }

            if (!$.hasClass(target, 'is-disabled')) {
                if ($.hasClass(target, 'pika-button') && !$.hasClass(target, 'is-empty')) {
                    var selectedDate = new Date(self._y, self._m, parseInt(target.innerHTML, 10));

                    if( opts.careTime ) {
                        selectedDate.setHours(self._hour||0, self._minute||0, self._second||0, 0)
                    }
                    else {
                        window.setTimeout(function() { self.hide(); }, 100);
                    }
                    self.setDate(selectedDate);
 
                    return;
                }
                else if ($.hasClass(target, 'pika-prev')) {
                    self.prevMonth();
                }
                else if ($.hasClass(target, 'pika-next')) {
                    self.nextMonth();
                }
            }
            if (!$.hasClass(target, 'pika-select')) {
                $.Event.cancel(e);
            } else {
                self._c = true;
            }
        };

        self._onChange = function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) return;
            
            if ($.hasClass(target, 'pika-select-month')) {
                self.gotoMonth(target.value);
            }
            else if ($.hasClass(target, 'pika-select-year')) {
                self.gotoYear(target.value);
            }
        };

        self._onInputChange = function(e) {
            if (e.firedBy === self) return;
 
            var date = string2Date(opts.field.value);
            self.setDate(isDate(date) ? date : null);
            if (!self._v) {
                self.show();
            }
        };

        self._onInputFocus = function() {
            self.show();
        };

        self._onInputClick = function() {
            self.show();
        };

        self._onInputBlur = function() {
            if ( !self._c ) {
                self._b = window.setTimeout(function() {
                    self.hide();
                }, 50);
            }
            self._c = false;
        };

        self._onClick = function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                pEl = target;
            if (!target) return;

            if ( $.hasClass(target, 'pika-select') ) {
                if (!target.onchange) {
                    target.setAttribute('onchange', 'return;');
                    $.Event.addEvent(target, 'change', self._onChange);
                }
            }

            do {
                if ($.hasClass(pEl, 'pika-single')) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));

            if (self._v && target !== opts.trigger && !opts.careTime) {
                self.hide();
            }
        };

        self.el = document.createElement('div');
        self.el.className = 'pika-single';

        $.Event.addEvent(self.el, 'mousedown', self._onMouseDown, true);
        $.Event.addEvent(self.el, 'change', self._onChange);

        if (opts.field) {
            document.body.appendChild(self.el);
            $.Event.addEvent(opts.field, 'change', self._onInputChange);

            if (!opts.defaultDate) {
                opts.defaultDate = string2Date(opts.field.value);
                opts.setDefaultDate = true;
            }
        }

        var defDate = opts.defaultDate;

        if (isDate(defDate)) {
            if (opts.setDefaultDate) {
                self.setDate(defDate, true);
            } else {
                self.gotoDate(defDate);
            }
        } else {
            self.gotoDate(new Date());
        }

        this.hide();
        self.el.className += ' is-bound';
        $.Event.addEvent(opts.trigger, 'click', self._onInputClick);
        $.Event.addEvent(opts.trigger, 'focus', self._onInputFocus);
        $.Event.addEvent(opts.trigger, 'blur', self._onInputBlur);
    };


    /** public JCalendar API */
    JCalendar.prototype = {

        config: function(options) {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                setToStartOfDay(opts.minDate);
                opts.minYear  = opts.minDate.getFullYear();
                opts.minMonth = opts.minDate.getMonth();
            }
            if (opts.maxDate) {
                setToStartOfDay(opts.maxDate);
                opts.maxYear  = opts.maxDate.getFullYear();
                opts.maxMonth = opts.maxDate.getMonth();
            }

            if ($.isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                opts.yearRange = Math.min(opts.yearRange, 50);
            }

            if(opts.careTime) {
                opts.format += opts.format.length == 10 ? ' hh:mm:ss' : "";
            }
            return opts;
        },

        toString: function(format) {
            format = format || this._o.format;
            return !isDate(this._d) ? '' : this._d.format(format);
        },

        getDate: function() {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },
 
        setDate: function(date, preventOnSelect) {
            if (!date) {
                this._d = null;
                return this.draw();
            }
            if (typeof date === 'string') {
                date = string2Date(date);
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            if(!this._o.careTime) {
                setToStartOfDay(this._d);
            } else {
                this._hour = this._d.getHours();
                this._minute = this._d.getMinutes();
                this._second= this._d.getSeconds();
            }
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
            }

            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        gotoDate: function(date) {
            if (!isDate(date))  return;

            this._y = date.getFullYear();
            this._m = date.getMonth();
            this.draw();
        },

        gotoToday: function() {
            this.gotoDate(new Date());
        },
 
        gotoMonth: function(month) {
            if (!isNaN( (month = parseInt(month, 10)) )) {
                this._m = month < 0 ? 0 : month > 11 ? 11 : month;
                this.draw();
            }
        },

        nextMonth: function() {
            if (++this._m > 11) {
                this._m = 0;
                this._y++;
            }
            this.draw();
        },

        prevMonth: function() {
            if (--this._m < 0) {
                this._m = 11;
                this._y--;
            }
            this.draw();
        },

        gotoYear: function(year) {
            if (!isNaN(year)) {
                this._y = parseInt(year, 10);
                this.draw();
            }
        },

        /** refresh the HTML */
        draw: function(force) {
            if (!this._v && !force)  return;

            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth;

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            this.el.innerHTML = renderTitle(this) + this.render(this._y, this._m);
            if(opts.careTime) {
                this.el.innerHTML += renderTime(opts);
                var self = this;
                var $ranges = $('.timeAera input', self.el);
                setSelectdTime($ranges, self);

                $('.timeAera button', self.el).click(function(){
                    var _time = getSelectdTime( $ranges );
                    if( $.isNullOrEmpty(self._o.field.value) ) {
                        self._o.field.value = new Date().format(opts.format);
                    }
                    self._o.field.value = self._o.field.value.split(" ")[0] + " " + _time;
                    self._o.field.focus();

                    var date = string2Date(opts.field.value);
                    self._hour = date.getHours();
                    self._minute = date.getMinutes();
                    self._second = date.getSeconds();

                    window.setTimeout(function() {
                        self.hide();
                    }, 50);
                });
            }

            this.adjustPosition();
            if(opts.field.type !== 'hidden') {
                window.setTimeout(function() {
                    opts.trigger.focus();
                }, 1);
            }
        },

        adjustPosition: function() {
            var field = this._o.trigger, pEl = field,
                width = this.el.offsetWidth, 
                height = this.el.offsetHeight,
                viewportWidth  = window.innerWidth || document.documentElement.clientWidth,
                viewportHeight = window.innerHeight || document.documentElement.clientHeight,
                scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop,
                left, top, clientRect;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top  = pEl.offsetTop + pEl.offsetHeight;
                while((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top  += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if (left + width > viewportWidth ||
                ( this._o.position.indexOf('right') > -1 &&  left - width + field.offsetWidth > 0) ) {

                left = left - width + field.offsetWidth;
            }
            if (top + height > viewportHeight + scrollTop ||
                ( this._o.position.indexOf('top') > -1 && top - height - field.offsetHeight > 0  ) ) {

                top = top - height - field.offsetHeight;
            }

            this.el.style.cssText = [
                'position: absolute',
                'left: ' + left + 'px',
                'top: ' + top + 'px'
            ].join(';');
        },

        /** render HTML for a particular month */
        render: function(year, month)  {
            var opts   = this._o,
                now    = new Date(),
                days   = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data   = [],
                row    = [];

            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }

            var cells = days + before,
                after = cells;
            while(after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            for (var i = 0, r = 0; i < cells; i++) {
                var day = new Date(year, month, 1 + (i - before)),
                    isDisabled = (opts.minDate && day < opts.minDate) || (opts.maxDate && day > opts.maxDate),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    isEmpty = i < before || i >= (days + before);

                row.push(renderDay(1 + (i - before), isSelected, isToday, isDisabled, isEmpty));

                if (++r === 7) {
                    data.push(renderRow(row));
                    row = [];
                    r = 0;
                }
            }
            return renderTable(opts, data);
        },

        isVisible: function() {
            return this._v;
        },

        show: function() {
            if (!this._v) {
                $.Event.addEvent(document, 'click', this._onClick);
                $(this.el).removeClass('is-hidden');
                this._v = true;
                this.draw();

                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function() {
            var v = this._v;
            if (v !== false) {
                $.Event.removeEvent(document, 'click', this._onClick);
                this.el.style.cssText = '';
                $(this.el).addClass('is-hidden');
                this._v = false;

                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /** GAME OVER */
        destroy: function() {
            this.hide();
            $.Event.removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            $.Event.removeEvent(this.el, 'change', this._onChange);
            if (this._o.field) {
                $.Event.removeEvent(this._o.field, 'change', this._onInputChange);
                $.Event.removeEvent(this._o.trigger, 'click', this._onInputClick);
                $.Event.removeEvent(this._o.trigger, 'focus', this._onInputFocus);
                $.Event.removeEvent(this._o.trigger, 'blur', this._onInputBlur);
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return JCalendar;
});