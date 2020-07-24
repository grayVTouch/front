(function(){
    "use strict";
    
    function Prompt(html , option){
        var self = this;
        this.default = {
            time: 300 ,
            // 状态：show hide
            status: 'show' ,
            opacity: 0.2 ,
            maxWidth: '' ,
            title: '信息' ,
            margin: '0' ,
            // 弹层打开后毁掉
            success: null ,
            // 点击确认按钮回调
            confirm: null ,
            // 点击取消按钮回调
            cancel: null ,
            // 点击关闭按钮回调
            close: null ,
            // 是否显示关闭按钮
            closeBtn: true ,
            // 容器元素
            // container: document.body ,
            // success | error | info | none
            icon: 'none' ,
            // 按钮列表
            action: [
                {
                    name: '确认' ,
                    callback: function(){
                        // 关闭当前弹窗
                        self.hide(self.option.confirm);
                    }
                }
            ]
        };
        if (!G.isObject(option)) {
            option = this.default;
        }
        this.iconRange = ['success' , 'error' , 'info' , 'none'];
        this.statusRange = ['show' , 'hide'];
        this.option = {};
        this.option.html = G.isString(html) ? html : '';
        this.option.time = G.isNumber(option.time) ? option.time : this.default.time;
        this.option.status = G.contain(option.status , this.statusRange) ? option.status : this.default.status;
        this.option.opacity = G.isNumber(option.opacity) ? option.opacity : this.default.opacity;
        this.option.margin = G.isString(option.margin) ? option.margin : this.default.margin;
        this.option.title = G.isString(option.title) ? option.title : this.default.title;
        this.option.maxWidth = G.isValid(option.maxWidth) ? option.maxWidth : this.default.maxWidth;
        this.option.action = G.isArray(option.action) ? option.action : this.default.action;
        this.option.container = G.isDom(option.container) ? option.container : this.default.container;
        this.option.success = G.isFunction(option.success) ? option.success : this.default.success;
        this.option.confirm = G.isFunction(option.confirm) ? option.confirm : this.default.confirm;
        this.option.cancel = G.isFunction(option.cancel) ? option.cancel : this.default.cancel;
        this.option.close = G.isFunction(option.close) ? option.close : this.default.close;
        this.option.closeBtn = G.isBoolean(option.closeBtn) ? option.closeBtn : this.default.closeBtn;
        this.option.icon = G.contain(option.icon , this.iconRange) ? option.icon : this.default.icon;

        this.run();
    }

    var p = Prompt;

    // 静态属性

    // 弹窗数量
    p.count = 0;
    // 实例
    p.instance = [];

    // 简易方法
    p.alert = function(msg , option){
        return new Prompt(msg , Object.assign({} , {
            icon: 'none' ,
        } , option));
    };

    // 简易方法
    p.info = function(msg , option){
        return new Prompt(msg , Object.assign({} , {
            icon: 'info' ,
        } , option));
    };

    p.success = function(msg , option){
        return new Prompt(msg , Object.assign({} , {
            icon: 'success' ,
        } , option));
    };

    p.error = function(msg , option){
        return new Prompt(msg , Object.assign({} , {
            icon: 'error' ,
        } , option));
    };

    p.del = function(instance){
        var i   = 0;
        var cur = null;
        for (; i < this.instance.length; ++i)
        {
            cur = this.instance[i];
            if (cur === instance) {
                this.instance.splice(i , 1);
                i--;
            }
        }
    };

    p.hide = function(){
        console.log(this.instance);
        this.instance.forEach(function(v){
            v.hide();
        });

        p.instance = [];
    };

    p.prototype = {
        constructor: p ,
        
        createPrompt: function(){
            var div = document.createElement('div');
                div = G(div);
                div.addClass(['prompt']);
            var html = '';
                html += '   <!-- 背景颜色 -->';
                // html += '    <div class="background"></div>';
                html += '    <!-- 内容 -->';
                html += '    <div class="content">';
                html += '       <div class="header">';
                html += '           <div class="left title">信息</div>';
                html += '           <div class="right action">';
                html += '                <div class="close">';
                html += '                   <i class="run-iconfont run-iconfont-close f-14"></i>';
                html += '                </div>';
                html += '            </div>';
                html += '        </div>';
                html += '       <div class="msg"></div>';
                html += '       <div class="message"></div>';
                html += '       <div class="actions"></div>';
                html += '    </div>';
            div.html(html);
            return div.get(0);
        } ,

        createIcon: function(icon){
            var _icon = '';
            switch (icon)
            {
                case 'success':
                    _icon = 'xiaolian';
                    break;
                case 'error':
                    _icon = 'shibaixiaolian';
                    break;
                case 'info':
                    _icon = 'tishi2';
                    break;
            }
            var i = document.createElement('i');
                i = G(i);
                i.addClass(['prompt-iconfont' , 'run-iconfont' , 'run-iconfont-' + _icon]);
            return i.get(0);
        } ,

        // 移除图标
        removeIcon: function(icon){
            this.dom.message.children({
                className: 'prompt-iconfont' ,
                tagName: 'i' ,
            }).each(function(dom){
                G(dom).parent().remove(dom.get(0));
            });
        } ,

        initStatic: function(){
            var self = this;
            this.dom = {
                root: G(document.body) ,
                win: G(window) ,
            };
            var prompt = this.createPrompt();
            this.dom.root.append(prompt);
            this.dom.prompt    = G(prompt);
            this.dom.content   = G('.content' , this.dom.prompt.get(0));
            this.dom.actions   = G('.actions' , this.dom.content.get(0));

            // 设置按钮
            this.option.action.forEach(function(v){
                var btn = document.createElement('button');
                    btn = G(btn);
                    btn.addClass(['action']);
                    btn.text(v.name);
                    btn.on('click' , v.callback.bind(self) , true , false);
                self.dom.actions.append(btn.get(0));
            });

            // this.dom.background    = G('.background' , this.dom.prompt.get(0));
            this.dom.header     = G('.header' , this.dom.content.get(0));
            this.dom.title      = G('.title' , this.dom.header.get(0));
            this.dom.actionAtHeader     = G('.action' , this.dom.header.get(0));
            this.dom.close      = G('.close' , this.dom.actionAtHeader.get(0));
            this.dom.message    = G('.message' , this.dom.content.get(0));


            this.data = {
                canMove:false ,
                initScale: 0.6 ,
                promptW: 0 ,
                promptH: 0 ,
                contentW: 0 ,
                contentH: 0 ,
                maxXAmount: 0 ,
                maxYAmount: 0 ,
                startTranslateX: 0 ,
                startTranslateY: 0 ,
                zIndex: 0 ,
                startX: 0 ,
                startY: 0 ,
                scaleX: 0 ,
                scaleY: 0 ,
            };

            this.canMove = false;


            // 参数
            this.startOpacity      = 0;
            this.endOpacity        = this.option.opacity;
            this.startMarginTop    = this.option.margin;
            this.endMarginTop      = '0px';

            // 弹层层级
            this.data.zIndex = parseInt(this.dom.prompt.css('zIndex'));
            this.data.zIndex += p.count++;

            // 保存实例
            p.instance.push(this);

            // 设置层级
            this.dom.prompt.css({
                zIndex: this.data.zIndex
            });

            // 错落感
            this.dom.content.css({
                marginTop: this.option.margin
            });

            // 标题
            this.dom.title.text(this.option.title);


            if (this.option.icon !== 'none') {
                this.dom.message.addClass('icon');
                var icon = icon = this.createIcon(this.option.icon);
                this.dom.message.append(icon);
            }

            // 设置内容
            this.dom.message.html(this.dom.message.html() + this.option.html);

            // 是否隐藏关闭按钮
            if (!this.option.closeBtn) {
                this.dom.close.addClass('hide');
            }
        } ,

        initDynamic: function(){
            // 边界计算
            this.calBoundary();
            this.initPosInfo();
        } ,

        // 显示对话框
        show: function(callback){
            var self = this;

            this.dom.prompt.removeClass('hide');
            this.dom.prompt.startTransition('show');

            this.dom.content.startTransition('show' , function(){
                if (G.isFunction(self.option.success)) {
                    self.option.success();
                }
                if (G.isFunction(callback)) {
                    callback.call(this);
                }
            });
        } ,

        init: function(){
            // 显示隐藏
            if (this.option.status === 'show') {
                this.show();
            } else {
                this.hide();
            }
        } ,

        // 隐藏对话框
        hide: function(callback){
            var self = this;

            this.dom.prompt.endTransition('show');

            var transform = this.dom.content.css('transform');
            var transformInfo = G.parseTransform(transform);
            var translateX = transformInfo.translateX;
            var translateY = transformInfo.translateY;

            this.dom.content.css({
                translateX: translateX + 'px' ,
                translateY: translateY + 'px' ,
                scaleX:  this.data.initScale ,
                scaleY: this.data.initScale ,
            });

            this.dom.content.onTransition(function(){
                self.dom.root.remove(self.dom.prompt.get(0));
                if (G.isFunction(self.option.close)) {
                    self.option.close();
                }
                if (G.isFunction(callback)) {
                    callback.call(self);
                }
            });

            // this.dom.content.endTransition('show' , function(){
            //
            //
            // });
        } ,

        calBoundary: function(){
            this.data.promptW = this.dom.prompt.width();
            this.data.promptH = this.dom.prompt.height();
            this.data.contentW = this.dom.content.getTW();
            this.data.contentH = this.dom.content.getTH();

            this.data.minXAmount = this.dom.content.getWindowOffsetVal('left');
            this.data.minYAmount = this.dom.content.getWindowOffsetVal('top');
            this.data.maxXAmount = this.data.promptW - this.data.minXAmount - this.data.contentW;
            this.data.maxYAmount = this.data.promptH - this.data.minYAmount - this.data.contentH;
        } ,

        // 初始位置信息
        initPosInfo () {
            var transform = this.dom.content.css('transform');
            var transformInfo = G.parseTransform(transform);

            this.data.startTranslateX = transformInfo.translateX;
            this.data.startTranslateY = transformInfo.translateY;
            this.data.scaleX = transformInfo.scaleX;
            this.data.scaleY = transformInfo.scaleY;
        } ,

        mouseDownEvent: function(e){
            this.data.canMove = true;
            this.data.startX = e.clientX;
            this.data.startY = e.clientY;

            // 边界计算
            this.calBoundary();
            this.initPosInfo();


            // 取消过渡动画
            this.dom.content.css({
                transition: 'none' ,
            });
        } ,

        mouseMoveEvent (e) {
            if (!this.data.canMove) {
                return ;
            }
            var endX = e.clientX;
            var endY = e.clientY;
            var xAmount = endX - this.data.startX;
            var yAmount = endY - this.data.startY;

            // xAmount = Math.abs(xAmount) > this.data.maxXAmount ? (xAmount > 0 ? this.data.maxXAmount : -this.data.maxXAmount) : xAmount;
            // yAmount = Math.abs(yAmount) > this.data.maxYAmount ? (yAmount > 0 ? this.data.maxYAmount : -this.data.maxYAmount) : yAmount;
            if (xAmount < 0) {
                console.log('left move');
                // xAmount = Math.abs(xAmount) > this.data.minXAmount ? -this.data.minXAmount : xAmount;
                if (Math.abs(xAmount) > this.data.minXAmount) {
                    xAmount = -this.data.minXAmount
                    console.log('超出边界：' , this.data.minXAmount , (this.data.promptW - this.data.contentW) / 2);
                }
                else {
                    // xAmount;
                }
            } else {
                xAmount = Math.abs(xAmount) > this.data.maxXAmount ? this.data.maxXAmount : xAmount;
            }

            if (yAmount < 0) {
                yAmount = Math.abs(yAmount) > this.data.minYAmount ? -this.data.minYAmount : yAmount;
            } else {
                yAmount = Math.abs(yAmount) > this.data.maxYAmount ? this.data.maxYAmount : yAmount;
            }

            var endTranslateX = this.data.startTranslateX + xAmount;
            var endTranslateY = this.data.startTranslateY + yAmount;

            // console.log({
            //     translateX: endTranslateX + 'px' ,
            //     translateY: endTranslateY + 'px' ,
            //     scaleX: this.data.scaleX ,
            //     scaleY: this.data.scaleY
            // });
            this.dom.content.css({
                translateX: endTranslateX + 'px' ,
                translateY: endTranslateY + 'px' ,
                scaleX: this.data.scaleX ,
                scaleY: this.data.scaleY
            });
        } ,

        mouseUpEvent: function(){
            // 重置移动标志
            this.data.canMove = false;
            // 回复过渡动画
            this.dom.content.css({
                transition: '' ,
            });
        } ,

        initEvent: function(){
            this.dom.message.on('mousedown' , G.stop , true , false);
            this.dom.actions.on('mousedown' , G.stop , true , false);
            this.dom.close.on('click' , this.hide.bind(this) , true , false);
            this.dom.prompt.on('click' , this.hide.bind(this));
            this.dom.content.on('click' , G.stop);

            this.dom.header.on('mousedown' , this.mouseDownEvent.bind(this));
            this.dom.win.on('resize' , this.initDynamic.bind(this));
            this.dom.win.on('mousemove' , this.mouseMoveEvent.bind(this));
            this.dom.win.on('mouseup' , this.mouseUpEvent.bind(this));
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
            this.init();
        }
    };

    window.Prompt = p;
})();