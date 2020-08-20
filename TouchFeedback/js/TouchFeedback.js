/**
 * ********************
 * 动作反馈 by 陈学龙
 * 2019-02-23 01:06
 * ********************
 */
(function(){
    "use strict";

    function TouchFeedback(selector , option){
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

    TouchFeedback.prototype = {
        constructor: TouchFeedback ,

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
            var bX = this.dom.root.getWindowOffsetVal('left');
            var bY = this.dom.root.getWindowOffsetVal('top');
            var left = Math.abs(clientX - bX);
            var top = Math.abs(clientY - bY);
            var leftTop = Math.ceil(Math.sqrt(Math.pow(left , 2) + Math.pow(top , 2)));
            var leftBtm = Math.ceil(Math.sqrt(Math.pow(left , 2) + Math.pow(this.conH - top , 2)));
            var rightTop = Math.ceil(Math.sqrt(Math.pow(this.conW - left , 2) + Math.pow(top , 2)));
            var rightBtm = Math.ceil(Math.sqrt(Math.pow(this.conW - left , 2) + Math.pow(this.conH - top , 2)));
            var radius = Math.max(leftTop , leftBtm , rightTop , rightBtm);
            var w = radius * 2;
            var h = w;

            var dom = this.create();
            dom = G(dom);
            G.CAF(dom.get(0).__touch_feedback_timer__);
            window.clearTimeout(dom.get(0).__touch_feedback_timer_1__);
            var wAmount = w - this.sW;
            var hAmount = h - this.sH;
            var sTime = new Date().getTime();
            var eTime = sTime;
            var duration = 0;
            var ratio = 0;
            var _wAmount = 0;
            var _hAmount = 0;
            var endLeft = 0;
            var endTop = 0;
            var endW = 0;
            var endH = 0;
            var opacity = this.maxOpacity;
            var opacityAmount = this.maxOpacity;
            var _opacityAmount = 0;
            var endOpacity = 0;
            var self = this;
            var animate = function(){
                eTime = new Date().getTime();
                duration = eTime - sTime;
                ratio = duration / self.time;
                ratio = Math.min(ratio , 1);
                _wAmount = wAmount * ratio;
                _hAmount = hAmount * ratio;
                _opacityAmount = opacityAmount * ratio;
                endW = self.sW + _wAmount;
                endH = self.sH + _hAmount;
                endTop = top - _hAmount / 2;
                endLeft = left - _wAmount / 2;
                endOpacity = opacity - _opacityAmount;
                dom.css({
                    width: endW + 'px' ,
                    height: endH + 'px' ,
                    top: endTop + 'px' ,
                    left: endLeft + 'px' ,
                    opacity: endOpacity ,
                });

                if (ratio != 1) {
                    dom.get(0).__touch_feedback_timer__ = G.RAF(animate);
                    return ;
                }
                dom.get(0).__touch_feedback_timer_1__ = window.setTimeout(function(){
                    dom.parent().remove(dom.get(0));
                    self.domLen--;
                    if (self.domLen == 0) {
                        self.end();
                    }
                } , 100);
            };
            animate();
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

    window.TouchFeedback = TouchFeedback;
})();