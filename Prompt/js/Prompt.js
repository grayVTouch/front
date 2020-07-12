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
            margin: '10px' ,
            // 弹层打开后毁掉
            success: null ,
            // 点击确认按钮回调
            confirm: null ,
            // 点击取消按钮回调
            cancel: null ,
            // 点击关闭按钮回调
            close: null ,
            // 是否显示关闭按钮
            closeBtn: false ,
            // 容器元素
            container: document.body ,
            // 按钮列表
            btn: [
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
        this.statusRange = ['show' , 'hide'];
        this.option = {};
        this.option.html = G.isString(html) ? html : '';
        this.option.time = G.isNumber(option.time) ? option.time : this.default.time;
        this.option.status = G.contain(option.status , this.statusRange) ? option.status : this.default.status;
        this.option.opacity = G.isNumber(option.opacity) ? option.opacity : this.default.opacity;
        this.option.margin = G.isString(option.margin) ? option.margin : this.default.margin;
        this.option.title = G.isString(option.title) ? option.title : this.default.title;
        this.option.maxWidth = G.isValid(option.maxWidth) ? option.maxWidth : this.default.maxWidth;
        this.option.btn = G.isArray(option.btn) ? option.btn : this.default.btn;
        this.option.container = G.isDom(option.container) ? option.container : this.default.container;
        this.option.success = G.isFunction(option.success) ? option.success : this.default.success;
        this.option.confirm = G.isFunction(option.confirm) ? option.confirm : this.default.confirm;
        this.option.cancel = G.isFunction(option.cancel) ? option.cancel : this.default.cancel;
        this.option.close = G.isFunction(option.close) ? option.close : this.default.close;
        this.option.closeBtn = G.isBoolean(option.closeBtn) ? option.closeBtn : this.default.closeBtn;

        this.run();
    }

    var p = Prompt;

    // 静态属性

    // 弹窗数量
    p.count = 0;
    // 实例
    p.instance = [];

    // 简易方法
    p.alert = function(msg , opt){
        return new Prompt(msg , opt);
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
                div.addClass(['prompt' , 'hide']);
            var html = '';
                html += '   <!-- 背景颜色 -->';
                // html += '    <div class="background"></div>';
                html += '    <!-- 内容 -->';
                html += '    <div class="content">';
                html += '       <div class="header">';
                html += '           <div class="left title">信息</div>';
                html += '           <div class="right action">';
                html += '                <div class="btn close">';
                html += '                   <div class="positive"></div>';
                html += '                   <div class="negative"></div>';
                html += '                </div>';
                html += '            </div>';
                html += '        </div>';
                html += '       <div class="msg"></div>';
                html += '       <div class="btns"></div>';
                html += '    </div>';
            div.html(html);
            return div.get(0);
        } , 
        
        // createBtn: function(){
        //    
        // } , 

        initStatic: function(){
            var self = this;
            this.dom = {
                root: G(this.option.container) ,
            };
            var prompt = this.createPrompt();
            this.dom.root.append(prompt);
            this.dom.prompt    = G(prompt);
            this.dom.content   = G('.content' , this.dom.prompt.get(0));
            this.dom.btns      = G('.btns' , this.dom.content.get(0));

            // 设置按钮
            this.option.btn.forEach(function(v){
                var btn = document.createElement('button');
                    btn = G(btn);
                    btn.addClass(['btn']);
                    btn.text(v.name);
                    btn.on('click' , v.callback.bind(self) , true , false);
                self.dom.btns.append(btn.get(0));
            });

            // this.dom.background    = G('.background' , this.dom.prompt.get(0));
            this.dom.header     = G('.header' , this.dom.content.get(0));
            this.dom.title      = G('.title' , this.dom.header.get(0));
            this.dom.action     = G('.action' , this.dom.header.get(0));
            this.dom.close      = G('.close' , this.dom.action.get(0));
            this.dom.msg        = G('.msg' , this.dom.content.get(0));

            // 设置内容
            this.dom.msg.html(this.option.html);

            // 参数
            this.startOpacity      = 0;
            this.endOpacity        = this.option.opacity;
            this.startMarginTop    = this.option.margin;
            this.endMarginTop      = '0px';

            // 弹层层级
            this.zIndex = parseInt(this.dom.prompt.getStyleVal('zIndex'));
            this.zIndex += p.count++;

            // 保存实例
            p.instance.push(this);

            // 设置层级
            this.dom.prompt.css({
                zIndex: this.zIndex
            });

            // 弹层可拖动
            // this.dom.content.move(this.dom.prompt.get(0) , true);

            // 错落感
            this.dom.content.css({
                marginTop: this.option.margin
            });

            // 标题
            this.dom.title.text(this.option.title);

            // 内容
            this.dom.msg.html(this.option.html);

            // 是否隐藏关闭按钮
            if (!this.option.closeBtn) {
                this.dom.close.addClass('hide');
            }

            // 显示隐藏
            if (this.option.status == 'show') {
                this.show();
            } else {
                this.hide();
            }
        } ,

        initDynamic: function(){
            // 内容居中
            // this.dom.content.center(this.dom.prompt.get(0) , 'all');
        } ,

        // 显示对话框
        show: function(callback){
            var self = this;

            this.dom.prompt.removeClass('hide');
            this.dom.prompt.startTransition('show');

            // console.log(this.dom.content.get(0));

            this.dom.content.startTransition('show' , function(){
                if (G.isFunction(self.option.success)) {
                    self.option.success();
                }

                if (G.isFunction(callback)) {
                    callback.call(this);
                }
            });

        } ,

        // 隐藏对话框
        hide: function(callback){
            var self = this;

            this.dom.prompt.endTransition('show');
            this.dom.content.endTransition('show' , function(){
                self.dom.root.remove(self.dom.prompt.get(0));
                if (G.isFunction(self.option.close)) {
                    self.option.close();
                }

                if (G.isFunction(callback)) {
                    callback.call(self);
                }
            });

        } ,

        defineEvent: function(){
            this.dom.msg.on('mousedown' , G.stop , true , false);
            this.dom.btns.on('mousedown' , G.stop , true , false);
            this.dom.close.on('click' , this.hide.bind(this) , true , false);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.defineEvent();
        }
    };

    window.Prompt = p;
})();