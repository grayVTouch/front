/*
 * author 陈学龙 2016-12-12 17:03:00
 * 兼容性：IE 10及以上或同等级别其他浏览器
 */
(function(window) {
    'use strict';

    function Loading(selector , option){
        this.default = {
            // 动画时间
            time: 300 ,
            // 类名
            class: 'loading' ,
            // 支持 'show' , 'hide'
            status: 'show' ,
            // 具体风格: line-scale ball-pulse
            type: 'line-scale' ,
            // 加载文本提示，支持字符串 & 数组
            // 实际上就是展示进度信息
            text: '' ,
            // 点击关闭后回调函数
            close: null ,
            // 是否全屏固定
            fixed: true , 
        };

        if (!G.isValid(option)) {
            option = this.default;
        }

        this.statusRange = ['show' , 'hide'];
        this.typeRange = ['roll-loader' , 'line-scale' , 'ball-pulse'];
        this.textRange = ['String' , 'Array'];

        this.option = {};

        this.root	  		    = G(selector);
        this.option.time        = G.type(option.time)	 !== 'Number'                   ? this.default.time	    : option.time;
        this.option.status 		= !G.contain(option.status , this.statusRange) 			? this.default.status   : option.status;
        this.option.type        = !G.contain(option.type , this.typeRange) 				? this.default.type     : option.type;
        this.option.text        = !G.contain(G.type(option.text) , this.textRange)      ? this.default.text     : option.text;
        this.option.close 	    = G.isFunction(option.close)                            ? option.close          : this.default.close;
        this.option.fixed 	    = G.isBoolean(option.fixed)                             ? option.fixed          : this.default.fixed;

        this.run();
    }

    Loading.prototype = {
        author: '陈学龙' ,
        cTime: '2016/12/12 17:53:00' ,
        constructor: Loading ,

        initStatic: function(){
            var self = this;
            this.loading   = this.root.children({
                tagName: 'div' ,
                className: 'run-loading'
            } , false , true).first();
            this.bg		= G('.bg' , this.loading.get(0));
            this.cons		= G('.cons' , this.loading.get(0));
            this.text		= G('.text' , this.cons.get(0));
            this.animate	= G('.animate' , this.cons.get(0));
            this.items		= G('.item' , this.animate.get(0));
            this.btns      = G('.btns' , this.loading.get(0)).first();
            this.close    = G('.close' , this.btns.get(0));

            // 获取容器元素高度
            this.startOpacity  = 0;
            this.endOpacity    = 1;
            this.status = this.option.status;
            // close 回调函数接收的参数
            this.args = null;
            // close 上下文环境
            this.context = null;
            this.event = {
                close: this.option.close
            };
            // 处理文本
            this.text.text(this.option.text);
            // 仅显示给定的加载容器
            this.items.each(function(dom){
                dom = G(dom);
                if (dom.hasClass(self.option.type)) {
                    dom.removeClass('hide');
                }
            });
        } ,


        initDynamic: function(){
            // 要获取 offsetParent 就必须要元素存在于文档中
            this.loading.removeClass('hide');
            this._offsetParent = this.loading.offsetParent();
            // 要获取元素的真实尺寸，就必须不能让其受 Loading 元素的影响
            this.loading.addClass('hide');
            this._offsetParentScrollW = this._offsetParent.isDom() ? this._offsetParent.scrollWidth() : 0;
            this._offsetParentScrollH = this._offsetParent.isDom() ? this._offsetParent.scrollHeight() : 0;

            // 设置容器高度
            this.loading.css({
                width: this._offsetParentScrollW + 'px' ,
                height: this._offsetParentScrollH + 'px'
            });
        } ,

        initStyle: function(){
            if (this.status === 'hide') {
                this.hide();
            } else {
                this.show();
            }
        } ,

        show: function(){
            this.initDynamic();

            this.loading.removeClass('hide');
            this.status = 'show';

            this.loading.animate({
                opacity: this.endOpacity
            });
        } ,

        hide: function(){
            var self = this;
            this.status = 'hide';
            this.loading.animate({
                opacity: this.startOpacity
            } , function(){
                self.loading.addClass('hide');
            });
        } ,

        text: function(text){
            if (!G.isValid(text)) {
                this.text.html('');
                return ;
            }
            var self = this;
            var res = [];
            if (!G.isValid(text)) {
                this.text.addClass('hide');
                return ;
            }
            this.text.removeClass('hide');
            if (G.isString(text)) {
                res.push(text);
            }
            if (G.isArray(text)) {
                res = text;
            }
            // 清空原内容
            this.text.html('');
            // 新增内容
            res.forEach(function(v){
                var span = document.createElement('span');
                span = G(span);
                span.attr('class' , 'line');
                span.text(v);
                self.text.append(span.get(0));
            });
        } ,

        // 设置点击关闭按钮时，传递给 close 回调函数的参数
        setArgs: function(){
            this.args = arguments;
        } ,

        // 设置环境变量
        setContext: function(context){
            this.context = context;
        } ,

        // 缩放事件
        resizeEvent: function(){
            this.initDynamic();

            // 根据当前状态设置
            if (this.status === 'show') {
                this.loading.removeClass('hide');
            }
        } ,

        closeEvent: function(){
            this.hide();

            if (G.isFunction(this.event.close)) {
                this.event.close();
            }
        } ,

        listen: function(event , callback){
            this.event[event] = callback;
        } ,

        // 定义事件
        initEvent: function(){
            var win = G(window);

            this.close.on('click' , this.closeEvent.bind(this) , true , false);
            win.on('resize' , this.resizeEvent.bind(this) , true , false);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initStyle();
            this.initEvent();
        }
    };

    window.Loading = Loading;
})(window);