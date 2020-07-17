(function(){
    "use strict";

    function PicPlay_Transform(selector , option)
    {
        this.dom = {
            root: G(selector)
        };
        if (!this.dom.root.isDom()) {
            throw new Error('参数 1 错误');
        }
        this.default = {
            // 单位 ms
            time: 300 ,
            // 间隔时间
            duration: 5000 ,
            // 是否开启定时器
            timer: true ,
        };
        if (!G.isValid(option)) {
            option = this.default;
        }
        this.option = {};
        this.option.time = option.time ? option.time : this.default.time;
        this.option.duration = option.duration ? option.duration : this.default.duration;
        this.option.timer = G.isBoolean(option.timer) ? option.timer : this.default.timer;
        this.run();
    }

    PicPlay_Transform.prototype =  {
        constructor: PicPlay_Transform ,

        initStatic: function(){
            var self = this;
            this.dom.picPlayTransform = G('.pic-play-transform' , this.dom.root.get(0));
            this.dom.images = G('.images' , this.dom.picPlayTransform.get(0));
            this.dom.links = G('.link' , this.dom.images.get(0));
            this.dom.index = G('.index' , this.dom.picPlayTransform.get(0));
            this.dom.prev = G('.prev' , this.dom.picPlayTransform.get(0));
            this.dom.next = G('.next' , this.dom.picPlayTransform.get(0));

            if (this.dom.links.length > 0) {
                // 补充首尾节点
                var first = this.dom.links.first(true).clone();
                var last = this.dom.links.last(true).clone();
                last.insertBefore(this.dom.links.first(true).get(0));
                this.dom.images.append(first.get(0));
            }

            this.dom.allLinks = G('.link' , this.dom.images.get(0));

            var i = 0;
            for (i = 0; i < this.dom.links.length; ++i)
            {
                var index = G(this.createIndexByIndex(i + 1));
                this.dom.index.append(index.get(0));
                index.on('click' , this.indexEvent.bind(this));
            }

            this.dom.indexs = G('.item' , this.dom.index.get(0));
            
            this.data = {
                index: 1 , 
                maxIndex: this.dom.links.length , 
                minIndex: 1 , 
                transitionrun: false ,
                transitionStartTime: 0 ,
                transition: 'all ' + this.option.time + 'ms' ,
                noTransition: 'all 0ms' ,
                position: [] ,
                timer: null ,
            };
        } ,

        initDynamic: function(){
            var self = this;
            this.data.rootW = this.dom.root.width();
            this.data.rootH = this.dom.root.height();
            this.data.imagesW = this.data.rootW * this.dom.links.length;

            this.dom.picPlayTransform.css({
                width: this.data.rootW + 'px' ,
                height: this.data.rootH + 'px' ,
            });

            this.dom.allLinks.css({
                width: this.data.rootW + 'px' ,
                height: this.data.rootH + 'px' ,
            });

            // 计算出索引对应节点
            this.data.position = [];

            var i = 0;
            for (i = 0; i < this.dom.links.length; ++i)
            {
                this.data.position[i] = -(i + 1) * this.data.rootW;
            }
            this.data.minTranslateX = -(this.dom.allLinks.length - 1 ) * this.data.rootW;
            this.data.maxTranslateX = 0;
            this.data.translateX = this.data.position[0];

            this.dom.images.css({
                width: this.data.imagesW  + 'px' ,
                height: this.data.rootH + 'px' ,
                transform: 'translateX(' + this.data.translateX + 'px)' ,
            });

            G.nextTick(function(){
                self.dom.images.css({
                    transition: self.data.transition
                });
            });
            // 初始选中的索引
            var index = G(this.findIndexByIndex(this.data.index));
            index.highlight('cur' , this.dom.indexs.get());
            this.initTimer();
        } ,

        startTimer: function(){
            var self = this;
            this.data.timer = window.setTimeout(function(){
                console.log('pic-play-transform timer running');
                self.next();
            } , this.option.duration);
        } ,

        clearTimer: function(){
            window.clearTimeout(this.data.timer);
        } ,

        initTimer: function(){
            if (!this.option.timer) {
                return ;
            }
            this.clearTimer();
            this.startTimer();
        } ,
        indexEvent: function(e){
            var tar = G(e.currentTarget);
            this.index(tar.data('index'));
        } ,

        createIndexByIndex: function(index){
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item']);
            div.data('index' , index);
            return div.get(0);
        } ,

        setTranslateX: function(val , callback){
            this.dom.images.css({
                transform: 'translateX(' + val + 'px)' ,
            } , callback);
            this.dom.images.onTransition(callback);
        } ,

        removeTransition: function(){
            this.dom.images.css({
                transition: this.data.noTransition
            });
        } ,

        addTransition: function(){
            this.dom.images.css({
                transition: this.data.transition
            });
        } ,

        prev: function(){
            if (this.data.transitionrun) {
                var endTime = Date.now();
                if (endTime - this.data.transitionStartTime <= this.option.time) {
                    console.log('pic-play-transform prev transition running');
                    return ;
                }
                this.initTransition();
            }
            var self = this;
            var index;
            if (this.data.index > this.data.minIndex) {
                this.data.index--;
                this.data.translateX = this.data.position[this.data.index - 1];
                this.setTranslateX(this.data.translateX);
            } else {
                this.data.transitionStartTime = Date.now();
                this.data.transitionrun = true;
                this.data.index = this.data.maxIndex;
                this.setTranslateX(this.data.maxTranslateX , function(){
                    self.data.transitionrun = false;
                    self.removeTransition();
                    self.setTranslateX(self.data.position[self.data.position.length - 1]);
                    G.nextTick(self.addTransition.bind(self));
                });
            }
            index = G(this.findIndexByIndex(this.data.index));
            index.highlight('cur' , this.dom.indexs.get());
            this.initTimer();
        } ,

        initTransition: function(){
            this.data.transitionrun = false;
            this.addTransition();
        } ,

        next: function(){
            if (this.data.transitionrun) {
                var endTime = Date.now();
                if (endTime - this.data.transitionStartTime <= this.option.time) {
                    console.log('pic-play-transform next transition running');
                    return ;
                }
                this.initTransition();
            }
            var self = this;
            var index;
            if (this.data.index < this.data.maxIndex) {
                this.data.index++;
                this.data.translateX = this.data.position[this.data.index - 1];
                this.setTranslateX(this.data.translateX);
            } else {
                this.data.transitionStartTime = Date.now();
                this.data.transitionrun = true;
                this.data.index = this.data.minIndex;
                this.setTranslateX(this.data.minTranslateX , function(){
                    self.data.transitionrun = false;
                    self.removeTransition();
                    self.setTranslateX(self.data.position[0]);
                    G.nextTick(self.addTransition.bind(self));
                });
            }
            index = G(this.findIndexByIndex(this.data.index));
            index.highlight('cur' , this.dom.indexs.get());
            this.initTimer();
        } ,

        findIndexByIndex: function(index){
            var i = 0;
            var cur;
            var curIndex;
            index = parseInt(index);
            for (i = 0; i < this.dom.indexs.length; ++i)
            {
                cur = this.dom.indexs.jump(i , true);
                curIndex = parseInt(cur.data('index'));
                if (curIndex === index) {
                    return cur.get(0);
                }
            }
            throw new Error('没有找到对应的索引:' + index);
        } ,

        index: function(index){
            index = parseInt(index);
            var indexDom = G(this.findIndexByIndex(index));
                indexDom.highlight('cur' , this.dom.indexs.get());
            this.data.index = index;
            this.data.translateX = this.data.position[index - 1];
            this.setTranslateX(this.data.translateX);
            this.initTimer();
        } ,

        initEvent: function(){
            this.dom.prev.on('click' , this.prev.bind(this));
            this.dom.next.on('click' , this.next.bind(this));
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        } ,
    };

    window.PicPlay_Transform = PicPlay_Transform;
})();