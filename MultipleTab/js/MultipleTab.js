/**
 * authro 陈学龙 2017-09-12 15:18:00
 * 多标签页
 */

/**
 * 多标签页
 * 功能点介绍：
 * 1. 宽度缩放，规则：
 *      1.1 标签数量 * 单标签最大长度小于容器宽度，设置为单标签最大宽度
 *      1.2 单标签数量 * 单标签最大长度大于容器宽度，单标签长度 = 容器宽度 / 标签数量
 * 2. 标签拖拽规则
 *      2.1 鼠标在标签内释放的：
 *          2.1.1 单纯的移动标签，判定规则
 *              如果标签页进入另一个标签页内部长度超过 2/5，切换位置
 *      2.2 鼠标在标签外释放的
 *          2.2.1 关闭当前拖拽的标签
 *          2.2.2 获取他的链接，打开新的页面
 */
(function(){
    "use strict";

    function MultipleTab(selector , option){

        // 默认设置
        this.default = {
            // 新建标签后回调
            created: null ,
            // 标签页删除后回调函数
            deleted: null ,
            // 标签点击后回调
            focus: null ,
            // 图标
            ico: '../image/default/default.png' ,
            // 内容
            title: '新标签页' ,
            // 动画时间
            time: 300 ,
            // 默认标签是否可拖拽
            draggable: true ,
            // 是否默认保留首个标签（仅在 draggable = true 的时候保证正确性）
            saveFirst: false ,
        };

        if (G.type(option) === 'Undefined') {
            option = this.default;
        }

        // 元素容器
        this.con = G(selector);
        
        this.option = {};
        this.option.created = G.type(option['created']) !== 'Function' ? this.default.created   : option['created'];
        this.option.deleted = G.type(option['deleted']) !== 'Function' ? this.default.deleted   : option['deleted'];
        this.option.focus   = G.type(option['focus'])   !== 'Function' ? this.default.focus     : option['focus'];
        this.option.ico     = G.type(option['ico'])     !== 'String'   ? this.default.ico       : option['ico'];
        this.option.title   = G.type(option['title'])     !== 'String'   ? this.default.title       : option['title'];
        this.option.time    = G.type(option['time'])     !== 'Number'   ? this.default.time       : option['time'];
        this.option.draggable    = G.type(option['draggable'])     !== 'Boolean'   ? this.default.draggable       : option['draggable'];
        this.option.saveFirst    = G.type(option['saveFirst'])     !== 'Boolean'   ? this.default.saveFirst       : option['saveFirst'];

        this.run();
    }

    MultipleTab.prototype = {
        authro: '陈学龙' ,
        version: '1.0' ,
        c_time: '2017-09-12 15:18:00' ,
        constructor: MultipleTab ,

        initStatic: function(){
            // 元素相关
            this.multipleTab = G('.multiple-tab' , this.con.get(0));
            this.tabs = G('.tabs' , this.multipleTab.get(0));

            // 参数相关
            this.tabMaxW = 250;
            this.tabMinW = 0;

            // 设置进入当前标签进入其他标签的长度占标签长度的比率
            this.judgeRatio = 0.4;

            // 当前显示的标签页类名
            this.focusClassName = 'cur';

            // 容器的最大宽度
            this.scrollBarW    = 10;
        } ,

        initDynamic: function(){
            var self = this;
            
            this.multipleTabW  = this.multipleTab.width('content-box');
            this.tabsW         = this.multipleTabW - this.scrollBarW;
            this.__tabs__      = G('.tab' , this.tabs.get(0));

            // 标签数量
            this.count   = this.__tabs__.length;

            // 当前标签数量 * singleTabMaxW 合计占据的长度
            this.tabsMaxW = this.count * this.tabMaxW;

            // 计算出单标签的长度
            this.tabW = Math.floor(this.tabsMaxW > this.tabsW ? this.tabsW / this.count : this.tabMaxW);

            // 初始化标签
            this.__tabs__.each(function(dom){
                dom = G(dom);

                var ico     = G('.ico'  , dom.get(0));
                var text    = G('.text' , dom.get(0));
                var close   = G('.close', dom.get(0));
                var icoW    = ico.width('border-box');
                var closeW  = close.width('border-box');
                var textML  = icoW + 10;
                var textMR  = closeW + 15;
                var textW   = self.tabW - textML - textMR;

                dom.css({
                    width: self.tabW + 'px'
                });

                text.css({
                    width: textW + 'px'
                });
            });
        } ,

        init: function(){

        } ,

        // 注册标签事件
        loginEvent: function(tab){
            tab = G(tab);

            var close = G('.close' , tab.get(0));

            // 标签会有多个事件
            close.on('click'    , this.closeEvent.bind(this) , true , false);
            tab.on('dblclick'   , this.tabDoubleClickEvent.bind(this) , true , false);
            tab.on('click'      , this.tabClickEvent.bind(this) , true , false);
            tab.on('mousedown'  , this.tabMousedownEvent.bind(this) , true , false);
        } ,

        /**
         * 判断片段内是否有标签
         */
        hasTab: function(){
            var index   = this.getIndex();
            var tabSet =  G('.tab' , this.tabs.get(0));
            var tabsTW  = tabSet.length * this.tabW;

            if (tabsTW <= (index - 1) * this.tabsW) {
                return false;
            }

            return true;
        } ,

        // 当前项是否是选中项
        isFocus: function(tab){
            tab = G(tab);

            if (tab.hasClass('cur')) {
                return true;
            }

            return false;
        } ,

        // 删除指定标签
        deleteTab: function(tab){
            if (this.option.saveFirst) {
                // 是否保留首个标签
                if (this.__tabs__.jump(0 , true).get(0) === tab) {
                    // 首个标签
                    return ;
                }
            }
            tab = G(tab);
            if (tab.data('closable') !== 'true') {
                // 该标签不允许删除
                return ;
            }

            var self = this;
            var endW = '0px';
            var endOpacity = 0;

            tab.animate({
                width: endW ,
                opacity: endOpacity
            } , function(){
                // 切换标签
                if (self.isFocus(tab.get(0))) {
                    var nextTab = tab.nextSibling();

                    if (nextTab.isDom()) {
                        self.focus(nextTab.get(0));
                    } else {
                        var prevTab = tab.prevSibling();
                        if (prevTab.isDom()) {
                            self.focus(prevTab.get(0));
                        }
                    }
                }

                var id = tab.data('id');
                tab.parent().remove(tab.get(0));
                self.initDynamic();
                if (G.type(self.option.deleted) === 'Function') {
                    self.option.deleted.call(self , id , tab.get(0));
                }
            } , this.option.time);
        } ,

        // 关闭事件
        closeEvent: function(e){
            G.stop(e);

            // close 元素
            var tar = G(e.currentTarget);
            var tab = tar.parents({
                tagName: 'div' ,
                class: 'tab'
            } , this.tabs.get(0)).not({
                class: 'tabs'
            });

            this.deleteTab(tab.get(0));
        } ,

        tabDoubleClickEvent: function(e){
            G.stop(e);
            var tar = G(e.currentTarget);
            this.deleteTab(tar.get(0));
        } ,

        // 高亮显示给定项
        switchByTab: function(tab){
            tab = G(tab);
            tab.highlight(this.focusClassName , this.__tabs__.get());
        } ,

        switchById: function(id){
            const tab = this.tab(id);
            this.switchByTab(tab);
        } ,

        // 获取当前选中的项的相关属性
        getCurTabId: function(){

        } ,

        /**
         * 生成标签唯一ID
         */
        genID: function(){
            return G.randomArr(100 , 'mixed').join('');
        } ,

        /*
         * 创建标签
         * option = {
         *      text: '描述文本' ,
         *      ico: '描述图片' ,
         *      id: '标识符'
         * }
         */
        create: function(option , closable){
            closable = G.isBoolean(closable) ? closable : true;
            var self       = this;
            var _default = {
                text: this.option.title ,
                ico: this.option.ico ,
                attr: {}
            };
            if (G.type(option) === 'Undefined') {
                option = _default;
            }
            option['text']   = G.type(option['text']) !== 'String' ? _default['text'] : option['text'];
            option['ico']    = G.type(option['ico']) !== 'String' ? _default['ico'] : option['ico'];
            option['attr']   = !G.isObj(option['attr']) ? _default['attr'] : option['attr'];
            var id  = this.genID();
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['tab' , 'run-action-feedback']);
            div.data('id' , id);
            div.data('closable' , closable);
            var k;
            var p = 'data-';
            var _k = null;
            // 设置数据集属性
            for (k in option['attr'])
            {
                _k = k.replace(p , '');
                _k = p + k;
                div.attr(_k , option['attr'][k]);
            }
            var html = [];
            html.push();
            html.push(' <div class="inner">');
            html.push('         <div class="ico"><img src="' + option.ico + '" class="image"></div>');
            html.push('         <div class="text">' + option.text + '</div>');
            html.push('         <div class="close ' + (this.option.saveFirst && this.__tabs__.length < 1 || !closable ? 'hide' : '') + '">');
            html.push('             <div class="positive"></div>');
            html.push('             <div class="negative"></div>');
            html.push('         </div>');
            html.push(' </div>');
            div.html(html.join(''));
            // 添加标签
            this.tabs.append(div.get(0));
            // 参数重新初始化
            this.initDynamic();

            // 初始化样式
            div.css({
                width: 0 ,
                opacity: 0
            });
            // 高亮显示当前项
            this.switchByTab(div.get(0));
            var endW = this.tabW + 'px';
            var endOpacity = 1;

            // 动画展示
            div.animate({
                width: endW ,
                opacity: endOpacity
            } , function(){
                self.loginEvent(div.get(0));
                // 必须要重新执行一次初始化！
                // 因为可能会出现新的标签页出现，但旧标签页动画尚未结束的情况
                // 如果出现上述情况的时候，新标签页创建时的重新初始化的值针对
                // 还在动画中的标签页无效，所以必须在动画完成之后再次进行
                // 标签页重新初始化
                self.initDynamic();
                if (G.isFunction(self.option.created)) {
                    self.option.created.call(self , id);
                }
                G.invoke(self.option.focus , self , id);
            } , this.option.time);
            return id;
        } ,

        /**
         * 项点击事件
         */
        focus: function(tab){
            tab = G(tab);

            this.switchByTab(tab.get(0));

            var id = tab.data('id');

            if (G.type(this.option.focus) === 'Function') {
                this.option.focus.call(this , id);
            }
        } ,

        /**
         * 项点击事件（切换当前标签）
         */
        tabClickEvent: function(e){
            var tar = G(e.currentTarget);
            this.focus(tar.get(0));
        } ,

        // 获取 tab 可移动范围
        getTabMoveRange: function(tab){
            tab = G(tab);

            var clientW = document.documentElement.clientWidth;
            var extraL  = this.tabs.getDocOffsetVal('left');
            var extraR  = clientW - extraL - this.tabsW;
            var w       = tab.width('border-box');
            var l       = tab.getDocOffsetVal('left');
            var minL    = -(l - extraL);
            var maxL    = clientW - extraL - extraR - w;

            return {
                minL: minL ,
                maxL: maxL
            }
        } ,

        // 鼠标点击后触发事件（拖动标签时）
        tabMousedownEvent: function(e){
            if (!this.option.draggable) {
                return ;
            }
            var tab = G(e.currentTarget);
            this.canDrag = true;
            this.tabSX = e.clientX;
            this.tabSY = e.clientY;
            this.tabSL = tab.getCoordVal('left');
            this.tabST = tab.getCoordVal('top');
            this.range   = this.getTabMoveRange(tab.get(0));
            this.moveDOM = tab;

            // 选中
            this.focus(tab.get(0));

            // 设置最高层级
            tab.css({
                zIndex: '100000000'
            });
        } ,

        // 鼠标移动后触发事件（拖动标签时）
        tabMouseMoveEvent: function(e){
            if (!this.canDrag) {
                return ;
            }
            var tab = this.moveDOM;

            // 拖动标签
            this.tabEX = e.clientX;
            this.tabEY = e.clientY;

            var ox = this.tabEX - this.tabSX;
            var oy = this.tabEY - this.tabSY;

            var el = this.tabSL + ox;
            var et = this.tabST + oy;

            el = Math.max(this.range['minL'] , Math.min(this.range['maxL'] , el));

            /**
             * 只进行左右移动，不允许上下移动
             */
            tab.css({
                left: el + 'px' ,
                // top: et + 'px'
            });

            // 监听
            this.prevListen(tab.get(0));
            this.nextListen(tab.get(0));
        } ,

        // 位置还原
        originPosition: function(tab){
            tab = G(tab);
            var endLeft = '0px';
            var endTop  = '0px';
            tab.animate({
                left: endLeft ,
                top: endTop
            } , null , this.option.time);
        } ,

        // 位置判定
        judgePosition: function(tab , index){
            tab = G(tab);
            index = Math.max(0 , index - 1);

            var curLeft = tab.getCoordVal('left');
            // var tabW = tab.width('border-box');
            var prev = -(index * this.tabW + this.tabW / 3);
            var next = -prev;

            if (curLeft <= prev) {
                return 'prev';
            }

            if (curLeft >= next) {
                return 'next';
            }

            return 'origin';
        } ,

        // 给定集合，设定 left = 0，top = 0
        originRelative: function(doms){
            doms.forEach(function(dom){
                dom = G(dom);
                dom.css({
                    left: 0 ,
                    top: 0
                });
            });
        } ,

        // 切换到上一个
        prevPosition: function(tab){
            tab = G(tab);

            var prevSiblings = tab.prevSiblings({
                tagName: 'div' ,
                class: 'tab'
            });

            if (prevSiblings.length === 0) {
                this.originPosition(tab.get(0));
                return ;
            }

            var minLeft = -(prevSiblings.length * this.tabW);
            var curLeft = Math.max(minLeft , tab.getCoordVal('left'));
            var count   = Math.ceil(Math.abs(curLeft / this.tabW));
            var range   = -((count - 1) * this.tabW + this.tabW * 1 / 3);
            var index   = curLeft < range ? count - 1 : count - 2;

            if (index < 0) {
                this.originPosition(tab.get(0));
                return ;
            }

            var prev = prevSiblings.jump(index , true);

            // 移动 DOM 元素
            G.insertBefore(tab.get(0) , prev.get(0));

            tab.css({
                left: 0 ,
                top: 0
            });

            this.originRelative(prevSiblings.get());
        } ,

        // 切换到下一个
        nextPosition: function(tab){
            tab = G(tab);

            var nextSiblings = tab.nextSiblings({
                tagName: 'div' ,
                class: 'tab'
            });

            if (nextSiblings.length === 0) {
                this.originPosition(tab.get(0));
                return ;
            }

            var maxLeft = nextSiblings.length * this.tabW;
            var curLeft = tab.getCoordVal('left');
            curLeft = Math.min(maxLeft , curLeft);
            var count   = Math.ceil(Math.abs(curLeft / this.tabW));
            var range   = (count - 1) * this.tabW + this.tabW * 1 / 3;
            var index   = curLeft > range ? count - 1 : count - 2;

            // 这种情况是为了避免误操作导致调用该方法产生错误而设计的
            if (index < 0) {
                this.originPosition(tab.get(0));
                return ;
            }

            var next = nextSiblings.jump(index , true);

            // 交换 DOM 元素
            G.insertAfter(tab.get(0) , next.get(0));

            tab.css({
                left: '0px' ,
                top: '0px'
            });

            // 还原相关元素位置
            this.originRelative(nextSiblings.get());
        } ,

        /**
         * 前置元素移动监听
         */
        prevListen: function(tab) {
            tab = G(tab);

            var prevSiblings = tab.prevSiblings({
                tagName: 'div',
                class: 'tab'
            });

            if (prevSiblings.length === 0) {
                return ;
            }

            prevSiblings.each(function(dom , k){
                dom = G(dom);
                var type = this.judgePosition(tab.get(0) , k + 1);
                var endVal = 0;

                if (type === 'prev') {
                    endVal = this.tabW;
                }

                dom.css({
                    left: endVal + 'px'
                });
            }.bind(this));
        } ,

        /**
         * 下一个元素移动
         */
        nextListen: function(tab){
            tab = G(tab);

            var nextSiblings = tab.nextSiblings({
                tagName: 'div',
                class: 'tab'
            });

            if (nextSiblings.length === 0) {
                return ;
            }

            nextSiblings.each(function(dom , k){
                dom = G(dom);
                var type = this.judgePosition(tab.get(0) , k + 1);
                var endVal = 0;

                if (type === 'next') {
                    endVal = -this.tabW;
                }

                dom.css({
                    left: endVal + 'px'
                });
            }.bind(this));
        } ,

        /**
         * 确定位置
         */
        determinePosition: function(){
            // 最终确定位置
            var type = this.judgePosition(this.moveDOM.get(0) , 1);

            if (type === 'next') {
                this.nextPosition(this.moveDOM.get(0));
            }

            if (type === 'prev') {
                this.prevPosition(this.moveDOM.get(0));
            }

            if (type === 'origin') {
                this.originPosition(this.moveDOM.get(0));
            }

            this.moveDOM.css({
                zIndex: 'auto'
            });
        } ,

        // 鼠标松开后触发事件（拖动标签时）
        tabMouseupEvent: function(e){
            // 如果未发生拖拽行为，不做任何处理
            if (!this.canDrag) {
                return ;
            }

            this.canDrag = false;

            this.determinePosition();
        } ,

        title: function(id , title){
            var tab = G(this.tab(id));
            var text = G('.text' , tab.get(0));
            // 设置标签
            text.text(title === '' ? this.default.title : title);
        } ,

        // 通过 id 查找 tab
        tab: function(id){
            var i   = 0;
            var cur = null;
            for (; i < this.__tabs__.length; ++i)
            {
                cur = this.__tabs__.jump(i , true);
                if (cur.data('id') === id) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到当前 id 对应的 tab');
        } ,

        // 重新调整
        resize: function(){
            this.initDynamic();
        } ,

        initEvent: function(){
            var win = G(window);
            win.on('mousemove'  , this.tabMouseMoveEvent.bind(this) , true , false);
            win.on('mouseup'    , this.tabMouseupEvent.bind(this) , true , false);
            win.on('resize'     , this.resize.bind(this) , true , false);
        } ,

        // 获取 tab 上新增的额外属性
        attr: function(id , key){
            var tab = G(this.tab(id));
            return tab.data(key);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.init();
            this.initEvent();
        }
    };

    window.MultipleTab = MultipleTab;
})();