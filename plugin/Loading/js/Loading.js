/*
 * author 陈学龙 2016-12-12 17:03:00
 * 兼容性：IE 10及以上或同等级别其他浏览器
 */
(function(global , factory) {
    'use strict';

    if (typeof module != 'undefined' && typeof module.exports == 'object') {
       module.exports = global.document ?
		   factory(global , true) :
		   function(w){
       			if (!w.document) {
       				throw new Error('非 window 环境');
				}

				return factory(w);
		   }
    } else {
		factory(window);
    }
})(typeof window !== 'undefined' ? window : this , function(global , noGlobal){
    function Loading(dom , opt){
        var thisRange = [undefined , null , window];

        if (G.contain(this , thisRange) || !G.contain(this , thisRange) && this.constructor !== Loading) {
            return new Loading(dom , opt);
        }

        if (!G.isDom(dom)) {
            throw new TypeError('参数 1 类型错误');
        }

        this._default = {
            time: 300 ,
            // Loading.png 图片存放路径
            pluginUrl: '' ,
            class: 'Loading' ,
            // 支持 'show' , 'hide'
            status: 'show' ,
            // 类型：image 、 html
            type: 'html' ,
            // 具体风格
            style: 1 ,
			// 加载文本提示，支持字符串 & 数组
			text: '' ,
            // 点击关闭后回调函数
            close: null ,
        };

        this._statusRange = ['show' , 'hide'];
        this._typeRange       = ['image' , 'html'];

        this._con	  		= G(dom);
        this._time 			= G.type(opt['time'])	 !== 'Number'			 			? this._default['time']	   : opt['time'];
        this._pluginUrl	  	= G.type(opt['pluginUrl'])		 !== 'String'			 	? this._default['pluginUrl']  : opt['pluginUrl'];
        this._status 		= !G.contain(opt['status'] , this._statusRange) 			? this._default['status']  : opt['status'];
        this._type 			= !G.contain(opt['type'] , this._typeRange) 				? this._default['type']  : opt['type'];
        this._style 		= G.type(opt['style']) !== 'Number' 						? this._default['style']  : opt['style'];
        this._text 			= opt['text'];
        this._close 	    = G.isFunction(opt.close) ? opt.close : this._default.close;

        this._run();
    }

    Loading.prototype = {
        author: '陈学龙' ,
        cTime: '2016/12/12 17:53:00' ,
        constructor: Loading ,

        _initStaticHTML: function(){

        } ,

        _initStaticArgs: function(){
            this._loading	= G('.Loading' , this._con.get(0)).first();
            this._bg		= G('.bg' , this._loading.get(0));
            this._cons		= G('.cons' , this._loading.get(0));
            this._text_		= G('.text' , this._cons.get(0));
            this._animate	= G('.animate' , this._cons.get(0));
            this._image	= G('._image' , this._animate.get(0));
            this._images	= G('.image' , this._image.get(0));
            this._html 		= G('.html' , this._animate.get(0));
            this._items		= G('.item' , this._html.get(0));
            this._btns      = G('.btns' , this._loading.get(0)).first();
            this._close_     = G('.close' , this._btns.get(0));

            // 获取容器元素高度
            this._startOpacity = 0;
            this._endOpacity = 0.7;

            this.status = this._status;
        } ,

        _initStatic: function(){
        	var self = this;

        	// 处理文本
			this.text(this._text);

			// 设置 id
            this._images.each(function(dom , k){
                dom = G(dom);
                dom.data('style' , k + 1);
            });

            this._items.each(function(dom , k){
                dom = G(dom);
                dom.data('style' , k + 1);
            });

        	// 处理动画
        	var set = null;
        	if (this._type === 'image') {
                this._html.addClass('hide');
                set = this._images;
            } else if (this._type === 'html') {
        		this._image.addClass('hide');
        		set = this._items;
			} else {
        		// 这边可继续扩展
				throw new Error('不支持的类型');
			}

			// 循环处理
            set.each(function(dom){
                dom = G(dom);
                if (dom.data('style') != self._style) {
                    dom.addClass('hide');
                }
            });
        } ,

        _initDynamicHTML: function(){

        } ,

        _initDynamicArgs: function(){
            // 要获取 offsetParent 就必须要元素存在于文档中
            this._loading.removeClass('hide');
            this._offsetParent = this._loading.offsetParent();
            // 要获取元素的真实尺寸，就必须不能让其受 Loading 元素的影响
            this._loading.addClass('hide');
            this._offsetParentScrollW = this._offsetParent.isDom() ? this._offsetParent.scrollWidth() : 0;
            this._offsetParentScrollH = this._offsetParent.isDom() ? this._offsetParent.scrollHeight() : 0;
        } ,

        _initDynamic: function(){
            // 设置容器高度
            this._loading.css({
                width: this._offsetParentScrollW + 'px' ,
                height: this._offsetParentScrollH + 'px'
            });
        } ,

        _initialize: function(){
            this._loading.css({
                opacity: 1
            });

            // 初始化状态设置
            if (this._status === 'hide') {
                this.hide();
            } else {
                this.show();
            }
        } ,

        show: function(){
            this._initDynamicHTML();
            this._initDynamicArgs();
            this._initDynamic();

            this._loading.removeClass('hide');
            this.status = 'show';

            this._bg.animate({
                opacity: this._endOpacity
            });
        } ,

        hide: function(){
            var self = this;
            this.status = 'hide';
            this._bg.animate({
                opacity: this._startOpacity
            } , function(){
                self._loading.addClass('hide');
            });
        } ,

		text: function(text){
            if (!G.isValid(text)) {
                this._text_.html('');
                return ;
            }

        	var self = this;
        	var res = [];

        	if (!G.isValid(text)) {
        		this._text_.addClass('hide');
        		return ;
			}

			this._text_.removeClass('hide');

			if (G.isString(text)) {
				res.push(text);
			}

			if (G.isArray(text)) {
				res = text;
			}

			// 清空原内容
			this._text_.html('');

			// 新增内容
			res.forEach(function(v){
				var span = document.createElement('span');
					span = G(span);
					span.attr('class' , 'line');
					span.text(v);

				self._text_.append(span.get(0));
			});
		} ,

        // 缩放事件
        _resizeEvent: function(){
            this._initDynamicHTML();
            this._initDynamicArgs();
            this._initDynamic();

            // 根据当前状态设置
            if (this.status === 'show') {
                this._loading.removeClass('hide');
                this._bg.css({
                    opacity: this._endOpacity
                });
            }
        } ,

        _closeEvent: function(){
            this.hide();

            if (G.isFunction(this._close)) {
                this._close();
            }
        } ,

        // 定义事件
        _defineEvent: function(){
            var win = G(window);

            this._close_.on('click' , this._closeEvent.bind(this) , true , false);
            win.on('resize' , this._resizeEvent.bind(this) , true , false);
        } ,

        _run: function(){
            this._initStaticHTML();
            this._initStaticArgs();
            this._initStatic();
            this._initDynamicHTML();
            this._initDynamicArgs();
            this._initDynamic();
            this._initialize();
            this._defineEvent();
        }
    };

    if (!noGlobal) {
    	window.Loading = Loading;
	}

    return Loading;
});