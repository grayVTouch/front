(function(){
    "use strict";

    function SlideSwitch(selector , option)
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
            id: '' ,
        };
        if (!G.isValid(option)) {
            option = this.default;
        }
        this.option = {};
        this.option.time = option.time ? option.time : this.default.time;
        this.option.id = G.isValid(option.id) ? option.id : this.default.id;

        this.run();
    }

    SlideSwitch.prototype =  {
        constructor: SlideSwitch ,

        initStatic: function(){
            var self = this;
            this.dom.slideSwitch = G('.slide-switch' , this.dom.root.get(0));
            this.dom.list = this.dom.slideSwitch.children({
                className: 'list' ,
                tagName: 'div'
            } , false , true).first();
            this.dom.items = this.dom.list.children();

            this.data = {
                id: this.option.id ? this.option.id : this.dom.items.jump(0 , true).data('id') ,
                maxIndex: this.dom.items.length ,
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
            this.data.listW = this.data.rootW * this.dom.items.length;
            this.dom.slideSwitch.css({
                width: this.data.rootW + 'px' ,
            });

            this.dom.items.css({
                // width: this.data.rootW + 'px' ,
                // height: this.data.rootH + 'px' ,
            });

            // 计算出索引对应节点
            this.data.position = [];

            var i = 0;
            for (i = 0; i < this.dom.items.length; ++i)
            {
                this.data.position[i] = -i * this.data.rootW;
            }
            this.data.minTranslateX = -(this.dom.items.length - 1 ) * this.data.rootW;
            this.data.maxTranslateX = 0;

            var index = this.findIndexById(this.data.id);

            this.data.translateX = this.data.position[index];

            this.dom.list.css({
                // width: this.data.listW  + 'px' ,
                transform: 'translateX(' + this.data.translateX + 'px)' ,
            });

            G.nextTick(function(){
                self.dom.list.css({
                    transition: self.data.transition
                });
            });
        } ,

        findItemById: function(id){
            var i = 0;
            var cur = null;
            for (; i < this.dom.items.length; ++i)
            {
                cur = this.dom.items.jump(i , true);
                if (cur.data('id') === id) {
                    return cur.get(0);
                }
            }
            return false;
        } ,

        findIndexById: function(id){
            var i = 0;
            var cur = null;
            for (; i < this.dom.items.length; ++i)
            {
                cur = this.dom.items.jump(i , true);
                if (cur.data('id') === id) {
                    return i;
                }
            }
            throw new Error('未找到 id:' + id + '对应的项索引');
        } ,

        setTranslateX: function(val , callback){

        } ,

        checkIndexRange: function(index){
            if (index > this.data.maxIndex || index < this.data.minIndex) {
                throw new Error('索引超出范围，当前支持的索引范围：' + this.data.minIndex + '-' + this.data.maxIndex);
            }
        } ,

        switch: function(id , callback){
            var index = this.findIndexById(id);
            console.log(index , this.data.position);
            var translateX = this.data.position[index];
            this.data.id = id;
            this.dom.list.css({
                transform: 'translateX(' + translateX + 'px)' ,
            });
            this.dom.list.onTransition(callback);
        } ,

        initEvent: function(){

        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        } ,
    };

    window.SlideSwitch = SlideSwitch;
})();