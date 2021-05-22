/**
 * @author 陈学龙
 *
 * 2020-06-30
 */
(function(){
    "use strict";

    function PicPreview_Async(selector , option)
    {
        this.dom = {
            root: G(selector)
        };
        if (!this.dom.root.isDom()) {
            throw new Error('参数 1 错误');
        }
        this.option = {
            /**
             * 初始显示状态
             * visible 显示
             * hidden 隐藏
             */
            visibility: 'hidden' ,
            /**
             * 初始预览状态
             * spread 展开
             * narrow 收缩
             */
            previewStatus: 'narrow' ,
            /**
             * full 全屏
             * normal 正常
             */
            screenStatus: 'normal' ,
            // 图片源
            images: [] ,

            // 索引，下标从 1 开始
            index: 1 ,
        };
        if (!G.isValid(option)) {
            option = this.default;
        }
        var previewStatusRange = ['spread' , 'narrow'];
        var screenStatusRange = ['full' , 'normal'];
        var visibilityRange = ['visible' , 'hidden'];
        this.option.previewStatus = G.contain(option.previewStatus , previewStatusRange) ? option.previewStatus : this.option.previewStatus;
        this.option.screenStatus = G.contain(option.screenStatus , screenStatusRange) ? option.screenStatus : this.option.screenStatus;
        this.option.visibility = G.contain(option.visibility , visibilityRange) ? option.visibility : this.option.visibility;
        this.option.index = option.index ? option.index : this.option.index;
        this.option.images = option.images ? option.images : this.option.images;

        this.run();
    }

    PicPreview_Async.prototype = {
        constructor: PicPreview_Async ,

        show: function(index){
            index = G.isUndefined(index) ? this.data.index : parseInt(index);
            var self = this;
            this.dom.picPreviewAsync.removeClass('hide');
            this.dom.picPreviewAsync.startTransition('show' , function(){
                self.origin(self.data.index);
                // 设定
                self.initDynamic();
                // 定位到当前索引
                self.index(index);
                // 初始化工具箱
                self.showTool();
                self.hideTool();
            });
        } ,


        hide: function(){
            var self = this;
            this.dom.picPreviewAsync.endTransition('show' , function(){
                var item = self.findItemByIndex(self.data.index);
                item = G(item);
                item.removeClass(self.data.placementRange);
                self.dom.picPreviewAsync.addClass('hide');
            })
        } ,

        createItem: function(src){
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item' , 'loading']);
            var html = '<img src="" data-src="' + src + '" class="image" alt="">';
            div.html(html);
            return div.get(0);
        } ,


        initItemWithSiblingsByIndex (index) {
            var prevIndex = Math.max(this.data.minIndex , index - 1);
            var nextIndex = Math.min(this.data.maxIndex , index + 1);
            this.initItemByIndex(prevIndex);
            this.initItemByIndex(index);
            this.initItemByIndex(nextIndex);
        } ,

        // 初始化菜单项
        initItemImageByItem: function(item) {
            item = G(item);
            var index = parseInt(item.data('index'));
            var image = G('.image' , item.get(0));
            image.data('scale' , this.data.initScale);
            var src = image.data('src');
            var self = this;
            var initImage = function(width , height){
                width = parseInt(width);
                height = parseInt(height);
                image.data('width' , width);
                image.data('height' , height);
                image.data('done' , 'true');
                image.css({
                    transition: self.data.css.noTransition
                });
                item.removeClass(['horizontal' , 'vertical' , 'nature' , 'loading']);
                G.nextTick(function(){
                    image.css({
                        transition: '' ,
                    });
                    if (width > height) {
                        item.startTransition('horizontal');
                        item.data('placement' , 'horizontal');
                    } else {
                        if (height < self.data.clientH) {
                            item.startTransition('nature');
                            item.data('placement' , 'nature');
                        } else {
                            item.startTransition('vertical');
                            item.data('placement' , 'vertical');
                        }
                    }
                });
            };
            if (image.data('done') !== 'true') {
                image.native('onload' , function(){
                    initImage(image.native('width') , image.native('height'));
                });
                image.native('src' , src);
            } else {
                initImage(image.data('width') , image.data('height'));
            }
        } ,

        initItemImageByIndex: function(index){
            var item = this.findItemByIndex(index);
            this.initItemImageByItem(item);
        } ,

        // todo
        checkIndex (index) {
            return !(index < this.data.minIndex || index > this.data.maxIndex);
        } ,

        // 初始化图片节点
        initItemByIndex (index) {
            if (!this.checkIndex(index)) {
                throw new Error('当前索引： ' + index + ' 超出范围，支持的索引范围： ' + this.data.minIndex + '-' + this.data.maxIndex);
            }
            var item = this.findItemByIndex(index);
            if (item) {
                // 节点已经存在的情况下，不重复处理
                return ;
            }
            var self = this;
            var src = this.data.images[index - 1];
            var nextItem = this.findItemByIndex(index + 1);
            item = this.createItem(src);
            item = G(item);
            var image = G('.image' , item.get(0));

            // 属性初始化
            item.data('index' , index);

            // 事件注册
            item.on('dblclick' , this.originEvent.bind(this));
            item.on('mousedown' , this.imageMouseDownEvent.bind(this));

            image.on('click' , G.stop);

            // 节点新增
            if (nextItem) {
                item.insertBefore(nextItem);
            } else {
                var items = this.dom.bImages.children();
                var correctIndex = false;
                items.each(function(item){
                    item = G(item);
                    var curIndex = parseInt(item.data('index'));
                    if (curIndex > index) {
                        if (correctIndex !== false) {
                            if (correctIndex > curIndex) {
                                correctIndex = curIndex;
                            }
                        } else {
                            correctIndex = curIndex;
                        }
                    }
                });
                if (correctIndex === false) {
                    this.dom.bImages.append(item.get(0));
                } else {
                    var tarItem = this.findItemByIndex(correctIndex);
                    item.insertBefore(tarItem);
                }
            }
        } ,

        // 重置当前索引所在位置（仅在节点发生变更的时候需要处理）
        initBImagesPositionByIndexAndTransitionAndCallback: function(index , transition , callback){
            var self = this;
            transition = G.isBoolean(transition) ? transition : true;
            const item = G(this.findItemByIndex(index));
            // 容器位置重置（要求无过渡重置）
            if (!transition) {
                // 无动画过渡
                this.dom.bImages.addClass('no-transition');
            } else {
                // 有动画过渡
                this.dom.bImages.onTransition(function(){
                    G.invoke(callback , self);
                });
            }
            var prevSiblings = item.prevSiblings();
            var translateX = -prevSiblings.length * this.data.bImagesW;
            this.dom.bImages.css({
                transform: 'translateX(' + translateX + 'px)'
            });
            if (!transition) {
                // 无动画过渡
                G.nextTick(function(){
                    self.dom.bImages.removeClass('no-transition');
                    G.invoke(callback , self);
                });
            }
        } ,


        findItemByIndex: function(index){
            var imageItems = this.dom.bImages.children();
            var i = 0;
            var cur;
            var curIndex;
            for (; i < imageItems.length; ++i)
            {
                cur = imageItems.jump(i , true);
                curIndex = parseInt(cur.data('index'));
                if (curIndex === index) {
                    return cur.get(0);
                }
            }
            return null;
        } ,

        initStatic: function(){
            var self = this;
            this.dom.win = G(window);
            this.dom.html = G(document.documentElement);
            this.dom.body = G(document.body);
            this.dom.picPreviewAsync = G('.pic-preview-async' , this.dom.root.get(0));
            this.dom.preview = G('.preview' , this.dom.picPreviewAsync.get(0));
            this.dom.header = G('.header' , this.dom.preview.get(0));
            this.dom.info = G('.info' , this.dom.header.get(0));
            this.dom.action = G('.action' , this.dom.header.get(0));

            this.dom.origin = G('.origin' , this.dom.action.get(0));
            this.dom.shrink = G('.shrink' , this.dom.action.get(0));
            this.dom.grow = G('.grow' , this.dom.action.get(0));
            this.dom.fullScreen = G('.full-screen' , this.dom.action.get(0));
            this.dom.normalScreen = G('.normal-screen' , this.dom.action.get(0));
            this.dom.spread = G('.spread' , this.dom.action.get(0));
            this.dom.narrow = G('.narrow' , this.dom.action.get(0));
            this.dom.close = G('.close' , this.dom.action.get(0));

            this.dom.content = G('.content' , this.dom.preview.get(0));
            this.dom.bImages = G('.b-images' , this.dom.content.get(0));
            this.dom.itemsForBImages = G('.item' , this.dom.bImages.get(0));
            this.dom.imagesForBImages = G('.image' , this.dom.bImages.get(0));
            this.dom.prev = G('.prev' , this.dom.content.get(0));
            this.dom.next = G('.next' , this.dom.content.get(0));

            this.dom.message = G('.message' , this.dom.preview.get(0));

            this.dom.sImages = G('.s-images' , this.dom.picPreviewAsync.get(0));
            this.dom.title = G('.title' , this.dom.sImages.get(0));
            this.dom.closeInSImage = G('.close' , this.dom.title.get(0));
            this.dom.list = G('.list' , this.dom.sImages.get(0));

            this.switchSpreadOrShrink(this.option.previewStatus , false);
            this.switchFullOrNormalScreen(this.option.screenStatus , false);

            this.data = {
                images: this.option.images ,
                translateX: 0 ,
                position: [] ,
                index: this.option.index ,
                maxIndex: 0 ,
                minIndex: 1 ,
                placementRange: ['horizontal' , 'vertical' , 'nature'] ,
                css: {
                    horizontal: 'translate(-50% , -50%)' ,
                    vertical: 'translate(-50% , -50%)' ,
                    nature: 'translate(-50% , -50%)' ,
                    transition: 'all 0.3s' ,
                    noTransition: 'all 0s' ,
                    // 删掉 js 设置的 style 属性
                    noTransform: '' ,
                } ,
                minScale: 0.6 ,
                canMove: false ,
                mouseUpX: 0 ,
                mouseUpY: 0 ,
                timer: null ,
                // 图片初始的缩放大小
                initScale: 1 ,
                // callbacks: [] ,
                initSImages: false ,
            };

            // 获取数组源
            var images = this.dom.picPreviewAsync.data('images');
            images = G.isValid(images) ? G.jsonDecode(images) : [];
            this.data.images = this.data.images.concat(images);

            this.dom.itemsForSImages = G('.item' , this.dom.sImages.get(0));

            this.data.maxIndex = this.data.images.length;

            // debugger

            if (this.option.visibility === 'hidden') {
                this.dom.picPreviewAsync.removeClass('show');
                this.dom.picPreviewAsync.addClass('hide');
            } else {
                this.dom.picPreviewAsync.removeClass('hide');
                this.dom.picPreviewAsync.addClass('show');
            }


        } ,

        initDynamic: function(){
            var self = this;
            this.data.position = [];

            this.data.bImagesW = this.dom.bImages.getTW();
            this.data.bImagesH = this.dom.bImages.getTH();

            // var i = 0;
            // var loaded = 0;
            this.data.clientH = this.dom.html.clientHeight();
        } ,

        init: function(){
            if (this.option.visibility === 'visible') {
                this.index(this.data.index);
            }
            this.showTool();
            this.hideTool();
        } ,

        getImageInItem: function(item){
            return G('.image' , item).get(0);
        } ,

        initSImages: function(){
            var i = 1;
            var self = this;
            this.data.initSImages = true;
            this.data.images.forEach(function(src){
                var item = self.createItem(src);
                    item = G(item);
                item.data('index' , i++);
                self.dom.list.append(item.get(0));
                var image = G('.image' , item.get(0));
                image.native('onload' , function(){
                    item.removeClass('loading');
                });
                image.native('src' , src);

                item.on('click' , self.indexEvent.bind(self));
            });
            this.dom.itemsForSImages = G('.item' , this.dom.list.get(0));
            this.focusByIndex(this.data.index , true);
        } ,

        setBImagesTranslateXByIndexAndCallback: function(index , callback){
            var self = this;
            var item = this.findItemByIndex(index);
                item = G(item);
            var siblings = item.prevSiblings();
            var translateX = -siblings.length * this.data.bImagesW;
            this.dom.bImages.css({
                // transform: 'translateX(' + this.data.position[index - 1] + 'px)'
                transform: 'translateX(' + translateX + 'px)'
            });
            this.dom.bImages.onTransition(function(){
                G.invoke(callback , self);
            });
        } ,

        info: function(index){
            this.dom.info.text(index + '/' + this.data.maxIndex);
        } ,

        switchSpreadOrShrink: function(status , reset){
            var self = this;
            reset = G.isBoolean(reset) ? reset : false;
            switch (status)
            {
                case 'spread':
                    this.dom.spread.addClass('hide');
                    this.dom.close.addClass('hide');
                    this.dom.narrow.removeClass('hide');
                    this.dom.picPreviewAsync.addClass('full');
                    if (!this.data.initSImages) {
                        this.initSImages();
                    }
                    break;
                case 'narrow':
                    this.dom.spread.removeClass('hide');
                    this.dom.close.removeClass('hide');
                    this.dom.narrow.addClass('hide');
                    this.dom.picPreviewAsync.removeClass('full');
                    break;
                default:
                    throw new Error('不支持的状态');
            }
            if (reset) {
                this.dom.preview.onTransition(function(){
                    self.initDynamic();
                    self.initBImagesPositionByIndexAndTransitionAndCallback(self.data.index , true);
                });
            }
        } ,

        switchFullOrNormalScreen: function(status , reset){
            var self = this;
            reset = G.isBoolean(reset) ? reset : false;

            // this.dom.fullScreen.addClass('hide');
            // this.dom.normalScreen.addClass('hide');
            // todo 待完善的功能
            switch (status)
            {
                case 'full':
                    this.dom.picPreviewAsync.requestFullScreen();
                    this.dom.fullScreen.addClass('hide');
                    this.dom.normalScreen.removeClass('hide');
                    break;
                case 'normal':
                    this.dom.picPreviewAsync.exitFullScreen();
                    this.dom.fullScreen.removeClass('hide');
                    this.dom.normalScreen.addClass('hide');
                    break;
                default:
                    throw new Error('不支持的状态');
            }
            if (reset) {
                this.dom.preview.onTransition(function(){
                    self.initDynamic();
                });
            }
        } ,

        prev: function(){
            if (this.data.prevDisabled) {
                // console.log('节点更新导致的');
                return ;
            }
            if (this.data.index <= this.data.minIndex) {
                this.message('已经是首张图片~');
                return ;
            }
            var oIndex = this.data.index;
            this.origin(oIndex);
            this.data.index--;
            var item = this.findItemByIndex(this.data.index);
            var once = !item;
            this.initItemByIndex(this.data.index);
            if (once) {
                // 重新初始化源索引位置（要求无动画过渡）
                this.data.prevDisabled = true;
                this.initBImagesPositionByIndexAndTransitionAndCallback(oIndex , false , function(){
                    this.data.prevDisabled = false;
                    // 设置新的位置
                    this.initBImagesPositionByIndexAndTransitionAndCallback(this.data.index , true);
                    this.initItemImageByIndex(this.data.index);
                });
            } else {
                this.initBImagesPositionByIndexAndTransitionAndCallback(this.data.index , true);
            }
            this.info(this.data.index);
            this.focusByIndex(this.data.index);
        } ,

        next: function(){
            if (this.data.index >= this.data.maxIndex) {
                this.message('到底了~');
                return ;
            }
            var oIndex = this.data.index;
            // console.log('源索引：' , oIndex);
            this.origin(oIndex);
            this.data.index++;
            var item = this.findItemByIndex(this.data.index);
            var once = !item;
            if (once) {
                this.initItemByIndex(this.data.index);
                this.initBImagesPositionByIndexAndTransitionAndCallback(this.data.index , true);
                this.initItemImageByIndex(this.data.index);
            } else {
                this.initBImagesPositionByIndexAndTransitionAndCallback(this.data.index , true);
            }
            this.info(this.data.index);
            this.focusByIndex(this.data.index);
        } ,


        index: function(index , scroll){
            this.data.index = index;
            this.info(this.data.index);
            this.initItemByIndex(index , true);
            this.initItemImageByIndex(index);
            this.initBImagesPositionByIndexAndTransitionAndCallback(index , false);
            this.focusByIndex(this.data.index , scroll);
        } ,

        focusByIndex: function(index , scroll){
            if (!this.data.initSImages) {
                return ;
            }
            scroll = G.isBoolean(scroll) ? scroll : true;
            var indexDom = this.dom.itemsForSImages.jump(index - 1 , true);
            // 选中项
            indexDom.highlight('cur' , this.dom.itemsForSImages.get());
            if (scroll) {
                var floor = Math.ceil(index / 2);
                var margin = (floor - 1 ) * parseInt(indexDom.css('marginBottom'));
                var top = floor * indexDom.height('border-box') + margin;
                var listH = this.dom.list.height('content-box');
                if (top <= listH) {
                    this.dom.list.vScroll(300 , 0);
                } else {
                    var halfListH = listH / 2;
                    this.dom.list.vScroll(300 , top - listH + halfListH);
                }
            }
        } ,

        indexEvent: function(e){
            var tar = G(e.currentTarget);
            var index = tar.data('index');
                index = parseInt(index);
            this.index(index , false);
        } ,

        grow: function(amount){
            // var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
            var item = this.findItemByIndex(this.data.index);
                item = G(item);
            var image = G('.image' , item.get(0));
            var placement = item.data('placement');

            // var transform = image.getStyleVal('transform');
            // var transformInfo = G.parseTransform(transform);
            // this.data.sTranslateX = transformInfo.translateX;
            // this.data.sTranslateY = transformInfo.translateY;
            var scale = parseFloat(image.data('scale'));
                scale += amount;
                scale = scale.toFixed(3);
                image.data('scale' , scale);
            // this.data.scaleX = scale;
            // this.data.scaleY = scale;
            image.css({
                // transform: 'translate(' + this.data.sTranslateX + 'px , ' + this.data.sTranslateY + 'px)' + ' scale(' + scale + ', ' + scale + ')' ,
                transform: this.data.css[placement] + ' scale(' + scale + ', ' + scale + ')' ,
            });
        } ,

        shrink: function(amount){
            // var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
            var item = this.findItemByIndex(this.data.index);
                item = G(item);
            var image = G('.image' , item.get(0));

            var placement = item.data('placement');
            // var transform = image.getStyleVal('transform');
            // var transformInfo = G.parseTransform(transform);
            // this.data.sTranslateX = transformInfo.translateX;
            // this.data.sTranslateY = transformInfo.translateY;

            var scale = parseFloat(image.data('scale'));
            scale -= amount;
            scale = scale.toFixed(3);
            scale = Math.max(this.data.minScale , scale);
            image.data('scale' , scale);
            // this.data.scaleX = scale;
            // this.data.scaleY = scale;
            image.css({
                transform: this.data.css[placement] + ' scale(' + scale + ', ' + scale + ')' ,
                // transform: 'translate(' + this.data.sTranslateX + 'px , ' + this.data.sTranslateY + 'px)' + ' scale(' + scale + ', ' + scale + ')' ,
            });
        } ,

        origin: function(index){
            var item = this.findItemByIndex(index);
            if (!item) {
                // 节点不存在，无需处理
                return ;
            }
            item = G(item);
            var placement = item.data('placement');
            var image = G('.image' , item.get(0));
            image.data('scale' , 1);
            image.css({
                transform: this.data.css.noTransform
            });
            if (G.contain(placement , this.data.placementRange)) {
                item.addClass(placement);
            }
        } ,

        originEvent: function(){
            this.origin(this.data.index);
        } ,

        imageMouseDownEvent: function(e){
            G.prevent(e);
            this.data.canMove = true;
            var item = this.findItemByIndex(this.data.index);
                item = G(item);
            var image = G('.image' , item.get(0));
            image.addClass('grab');

            var transform = image.css('transform');
            transform = G.parseTransform(transform);
            // console.log(transform);
            this.data.x = e.clientX;
            this.data.y = e.clientY;
            this.data.sTranslateX = transform.translateX;
            this.data.sTranslateY = transform.translateY;
            this.data.scaleX = transform.scaleX;
            this.data.scaleY = transform.scaleY;

            image.css({
                transition: this.data.css.noTransition
            });
        } ,

        imageMouseMoveEvent: function(e){
            if (!this.data.canMove) {
                return ;
            }
            var x = e.clientX;
            var y = e.clientY;

            var xAmount = this.data.x - x;
            var yAmount = this.data.y - y;

            var endTranslateX = this.data.sTranslateX - xAmount;
            var endTranslateY = this.data.sTranslateY - yAmount;


            var item = this.findItemByIndex(this.data.index);
                item = G(item);
            var image = G('.image' , item.get(0));
            image.removeClass('grab');
            image.addClass('grabbing');
            image.css({
                transform: 'translate(' + endTranslateX + 'px , ' + endTranslateY + 'px) scale(' + this.data.scaleX + ' , ' + this.data.scaleY + ')'
            });
        } ,

        imageMouseupEvent: function(e){
            if (!this.data.canMove) {
                // 如果不是通过 mousedown 触发来的不用理会
                return ;
            }
            this.data.canMove = false;
            var item = this.findItemByIndex(this.data.index);
                item = G(item);
            var image = G('.image' , item.get(0));
            var placement = item.data('placement');
            var transform = image.css('transform');
            var transformInfo = G.parseTransform(transform);
            this.data.sTranslateX = transformInfo.translateX;
            this.data.sTranslateY = transformInfo.translateY;
            this.data.scaleX = transformInfo.scaleX;
            this.data.scaleY = transformInfo.scaleY;

            // 当前图片尺寸
            var imageW = image.width();
            var imageH = image.height();
            var scaleImageW = imageW * this.data.scaleX;
            var scaleImageH = imageH * this.data.scaleY;
            var halfScaleImageW = imageW / 2;
            var halfScaleImageH = imageH / 2;
            var xMoveRange = (scaleImageW - this.data.bImagesW) / 2;
            var yMoveRange = (scaleImageH - this.data.bImagesH) / 2;
            var maxX = -halfScaleImageW + xMoveRange;
            var minX = -halfScaleImageW - xMoveRange;
            var maxY;
            var minY;

            var endTransform = '';
            if (scaleImageW <= this.data.bImagesW && scaleImageH <= this.data.bImagesH) {
                // console.log('还原');
                // 还原
                endTransform = this.data.css[placement] + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else if (scaleImageW < this.data.bImagesW) {
                // console.log('水平居中');
                // 水平居中
                maxY = -halfScaleImageH + yMoveRange;
                minY = -halfScaleImageH - yMoveRange;
                this.data.sTranslateY = Math.max(minY , Math.min(maxY , this.data.sTranslateY));
                endTransform = 'translate(-50% , ' + this.data.sTranslateY +'px)' + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else if (scaleImageH < this.data.bImagesH) {
                // console.log('垂直居中');
                // 垂直居中
                this.data.sTranslateX = Math.max(minX , Math.min(maxX , this.data.sTranslateX));
                endTransform = 'translate(' + this.data.sTranslateX + 'px , -50%)' + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else {
                // console.log('不做修改');
                // 不做修改（限制边界）
                if (placement === 'vertical') {
                    maxY =  yMoveRange;
                    minY = -yMoveRange;
                } else {
                    maxY = -halfScaleImageH + yMoveRange;
                    minY = -halfScaleImageH - yMoveRange;
                }
                this.data.sTranslateY = Math.max(minY , Math.min(maxY , this.data.sTranslateY));
                this.data.sTranslateX = Math.max(minX , Math.min(maxX , this.data.sTranslateX));
                endTransform =  'translate(' + this.data.sTranslateX + 'px , ' + this.data.sTranslateY + 'px)' + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            }
            image.removeClass(['grab' , 'grabbing']);
            image.css({
                transition: this.data.css.transition ,
                transform: endTransform ,
            });
            this.data.mouseUpX = e.clientX;
            this.data.mouseUpY = e.clientY;
        } ,

        showTool: function(){
            window.clearTimeout(this.data.timer);
            this.dom.header.addClass('show');
            this.dom.prev.addClass('show');
            this.dom.next.addClass('show');
        } ,

        hideTool: function(){
            var self = this;
            this.data.timer = window.setTimeout(function(){
                self.dom.header.removeClass('show');
                self.dom.prev.removeClass('show');
                self.dom.next.removeClass('show');
            } , 5 * 1000);

        } ,

        contentMouseMoveEvent: function(){
            this.showTool();
            this.hideTool();
        } ,

        prevEvent: function(e){
            G.stop(e);
            this.prev();
        } ,
        nextEvent: function(e){
            G.stop(e);
            this.next();
        } ,
        initEvent: function(){
            var self = this;
            this.dom.fullScreen.on('click' , this.switchFullOrNormalScreen.bind(this , 'full'));
            this.dom.normalScreen.on('click' , this.switchFullOrNormalScreen.bind(this , 'normal'));
            this.dom.spread.on('click' , this.switchSpreadOrShrink.bind(this , 'spread' , true));
            this.dom.narrow.on('click' , this.switchSpreadOrShrink.bind(this , 'narrow' , true));
            this.dom.prev.on('click' , this.prevEvent.bind(this));
            this.dom.next.on('click' , this.nextEvent.bind(this));
            // this.dom.itemsForSImages.on('click' , this.indexEvent.bind(this));
            this.dom.grow.on('click' , this.grow.bind(this , 1));
            this.dom.shrink.on('click' , this.shrink.bind(this , 1));
            this.dom.origin.on('click' , this.originEvent.bind(this));


            // this.dom.imagesForBImages.on('click' , G.stop);
            // this.dom.imagesForBImages.on('dblclick' , this.originEvent.bind(this));
            // this.dom.imagesForBImages.on('mousedown' , this.imageMouseDownEvent.bind(this));

            this.dom.win.on('mousemove' , this.imageMouseMoveEvent.bind(this));
            this.dom.win.on('mouseup' , this.imageMouseupEvent.bind(this));
            this.dom.win.on('resize' , this.initDynamic.bind(this));
            this.dom.content.on('wheel' , this.wheelEvent.bind(this));
            this.dom.content.on('mousemove' , this.contentMouseMoveEvent.bind(this));
            this.dom.close.on('click' , this.hide.bind(this));
            this.dom.closeInSImage.on('click' , this.hide.bind(this));
            this.dom.content.on('click' , this.hide.bind(this));
            this.dom.header.on('click' , G.stop);
            this.dom.win.on('keyup' , function(e){
                var keyCode = e.keyCode;
                console.log('keycode' , keyCode);
                if (keyCode === 27) {
                    // esc 关闭
                    self.hide();
                } else if (keyCode === 1) {

                } else {

                }
                self.hide();
            });
        } ,

        wheelEvent: function(e){
            G.prevent(e);
            if (e.deltaY < 0) {
                // 放大
                this.grow(0.2);
            } else {
                // 缩小
                this.shrink(0.2);
            }
        } ,

        message: function(text){
            var self = this;
            var div = document.createElement('div');
                div = G(div);
                div.addClass('message');
                div.text(text);
                this.dom.preview.append(div.get(0));
                G.nextTick(function(){
                    div.addClass('show');
                    window.setTimeout(function(){
                        div.endTransition('show' , function(){
                            div.parent().remove(div.get(0));
                        });
                    } , 3 * 1000);
                });
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
            this.init();
        } ,
    };

    window.PicPreview_Async = PicPreview_Async;
})();
