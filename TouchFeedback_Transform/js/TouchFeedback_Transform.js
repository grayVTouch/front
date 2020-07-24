/**
 * ********************
 * 动作反馈 by 陈学龙
 * 2019-02-23 01:06
 * ********************
 */
(function(){
    "use strict";

    function TouchFeedback_Transform(selector , option){
        this.default = {
            time: 300 ,
            opacity: 0.5 ,
        };

        if (!G.isObject(option)) {
            option = this.default;
        }

        this.dom = {
            root: G(selector)
        };
        this.time = G.isNumber(option.time) ? option.time : this.default.time;
        this.opacity = G.isNumeric(option.opacity) ? option.opacity : this.default.opacity;
        this.run();
    }

    TouchFeedback_Transform.prototype = {
        constructor: TouchFeedback_Transform ,

        initStatic: function(){
            this.once = true;
            this.sW = 0;
            this.sH = 0;
            this.maxOpacity = this.opacity;
            this.domLen = 0;
        } ,

        initDynamic: function(){

        } ,

        start: function(){
            var touchFeedback = document.createElement('div');
            touchFeedback.className = 'touch-feedback';
            this.dom.root.append(touchFeedback);
            this.touchFeedback = G(touchFeedback);
            this.conW = this.touchFeedback.width('border-box');
            this.conH = this.touchFeedback.height('border-box');
        } ,

        end: function(){
            this.domLen = 0;
            this.dom.root.remove(this.touchFeedback.get(0));
            if (this.position !== this.dom.root.css('position')) {
                if (this.position === 'static') {
                    // 去掉 position 样式设置
                    this.dom.root.css({
                        position: '' ,
                    });
                    return ;
                }
                this.dom.root.css({
                    position: this.position ,
                });
            }

        } ,

        create: function(){
            var div = document.createElement('div');
            div = G(div);
            div.addClass('circle');
            this.touchFeedback.append(div.get(0));
            this.domLen++;
            div.css({
                opacity: this.maxOpacity ,
                backgroundColor: this.backgroundColor ,
            });
            return div.get(0);
        } ,

        mousedownEvent: function(e){
            var x = e.clientX;
            var y = e.clientY;
            if (e.which !== 1) {
                return ;
            }
            this.position = this.dom.root.css('position');
            this.backgroundColor = this.dom.root.css('color');

            if (this.position === 'static') {
                this.dom.root.css({
                    position: 'relative'
                });
            }
            this.animate(x , y);
        } ,

        animate: function(clientX , clientY){
            if (this.domLen < 1) {
                this.start();
            }
            // 根元素中心点的位置
            var centerPointLeft = this.conW / 2;
            var centerPointTop  = this.conH / 2;

            var bX = this.dom.root.getWindowOffsetVal('left');
            var bY = this.dom.root.getWindowOffsetVal('top');

            // 这个是实际中心点的位置
            var left = Math.abs(clientX - bX);
            var top = Math.abs(clientY - bY);

            var leftTop = Math.ceil(Math.sqrt(Math.pow(left , 2) + Math.pow(top , 2)));
            var leftBtm = Math.ceil(Math.sqrt(Math.pow(left , 2) + Math.pow(this.conH - top , 2)));
            var rightTop = Math.ceil(Math.sqrt(Math.pow(this.conW - left , 2) + Math.pow(top , 2)));
            var rightBtm = Math.ceil(Math.sqrt(Math.pow(this.conW - left , 2) + Math.pow(this.conH - top , 2)));
            var radius = Math.max(leftTop , leftBtm , rightTop , rightBtm);
            var w = radius * 2;
            var h = w;

            // 元素一半的位置
            var halfW = w / 2;
            var halfH = h / 2;

            var dom = this.create();
            dom = G(dom);

            var translateX =  -halfW - (centerPointLeft - left)  + 'px';
            var translateY =  -halfH - (centerPointTop - top) + 'px';

            dom.css({
                transition: '' ,
                translateX: translateX ,
                translateY: translateY ,
                scaleX: 0 ,
                scaleY: 0 ,
                width: w + 'px' ,
                height: h + 'px' ,
                opacity: this.opacity ,
            });

            var self = this;

            G.nextTick(function(){
                dom.css({
                    transition: 'all ' +  self.time + 'ms linear' ,
                    // scale
                    translateX: translateX ,
                    translateY: translateY ,
                    scaleX: 1 ,
                    scaleY: 1 ,
                    opacity: 0 ,
                });
                dom.onTransition(function(){
                    dom.parent().remove(dom.get(0));
                    self.domLen--;
                    if (self.domLen == 0) {
                        self.end();
                    }

                });
            });
        } ,

        initEvent: function(){
            this.dom.root.on('mousedown' , this.mousedownEvent.bind(this) , true , false);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        } ,
    };

    window.TouchFeedback_Transform = TouchFeedback_Transform;
})();