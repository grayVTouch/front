/**
 * 消息提醒插件 by running at 2020-07-22
 * 该插件依赖于 FeedTouch_Transform
 */

(function(){
    "use strict";
    
    function Tip(message , option){
        var self = this;
        this.default = {
            time: 300 ,
            closeBtn: true ,
            duration: 5000 ,
            backgroundColor: '#424242' ,
        };
        if (!G.isObject(option)) {
            option = this.default;
        }
        this.option = {};
        this.option.message = G.isString(message) ? message : '';
        this.option.backgroundcolor = G.isString(option.backgroundcolor) ? option.backgroundcolor : this.option.backgroundcolor;
        this.option.time = G.isNumeric(option.time) ? option.time : this.default.time;
        this.option.duration = G.isNumeric(option.duration) ? option.duration : this.default.duration;
        this.option.closeBtn = G.isBoolean(option.closeBtn) ? option.closeBtn : this.default.time;
        this.run();
    }

    var p = Tip;

    // 静态属性

    // 弹窗数量
    p.count = 0;
    // 实例
    p.instance = [];

    // 简易方法
    p.info = function(msg , option){
        return new Tip(msg , Object.assign({} , {

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
        this.instance.forEach(function(v){
            v.hide();
        });
        p.instance = [];
    };

    p.running = false;

    p.consume = function(){
        if (p.running) {
            return ;
        }
        var ins = p.instance.shift();
        if (!(ins instanceof p)) {
            return ;
        }
        ins.show();
    };

    p.prototype = {
        constructor: p ,
        
        createTip: function(){
            var div = document.createElement('div');
                div = G(div);
                div.addClass(['__tip__']);
            var html = '';
                html += ' <div class="message">我是消息内容fsfakf复健科第三方开始了地方开放就开了房间克里斯多夫就开始了对方就考虑是否家乐福克里斯多夫就开始砥砺奋斗开始了福克斯的房间开始了房间克里斯多夫圣诞快乐f</div>';
                html += ' <div class="close">关闭</div>';
            div.html(html);
            return div.get(0);
        } ,

        initStatic: function(){
            var self = this;
            this.dom = {
                root: G(document.body) ,
                win: G(window) ,
            };
            var tip = this.createTip();
            this.dom.root.append(tip);
            this.dom.tip    = G(tip);
            this.dom.message = G('.message' , this.dom.tip.get(0));
            this.dom.close   = G('.close' , this.dom.tip.get(0));

            this.dom.tip.css({
                backgroundColor: this.option.backgroundColor ,
            });

            // 水波纹反馈效果
            new TouchFeedback_Transform(this.dom.close.get(0));

            this.data = {
                timer: null ,
            };

            // 弹层层级
            this.data.zIndex = parseInt(this.dom.tip.css('zIndex'));
            this.data.zIndex += p.count++;

            // 保存实例
            p.instance.push(this);

            // 设置层级
            this.dom.tip.css({
                zIndex: this.data.zIndex
            });

            // 设置内容
            this.dom.message.text(this.option.message);

            // 是否隐藏关闭按钮
            if (!this.option.closeBtn) {
                this.dom.close.addClass('hide');
            }
        } ,

        initDynamic: function(){

        } ,

        init: function(){
            // 按队列消费
            p.consume();
        } ,

        // 显示对话框
        show: function(){
            var self = this;
            this.dom.tip.startTransition('show');
            this.data.timer = window.setTimeout(this.hide.bind(this) , this.option.duration);
            p.running = true;
        } ,

        // 隐藏对话框
        hide: function(){
            var self = this;
            this.dom.tip.endTransition('show' , function(){
                self.dom.tip.parent().remove(self.dom.tip.get(0));
                p.running = false;
                p.consume();
            });
            window.clearTimeout(this.data.timer);
        } ,

        initEvent: function(){
            this.dom.close.on('click' , this.hide.bind(this) , true , false);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
            this.init();
        }
    };

    window.Tip = p;
})();