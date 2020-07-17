/**
 * @author 陈学龙
 *
 * 2020-06-30
 */
(function(){
    "use strict";

    function PicPreview_Sync(selector , option)
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
             * spread 展开
             * narrow 收缩
             */
            previewStatus: 'spread' ,
            /**
             * full 全屏
             * normal 正常
             */
            screenStatus: 'normal' ,
            // 索引
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

        this.run();
    }

    PicPreview_Sync.prototype = {
        constructor: PicPreview_Sync ,

        show: function(index){
            index = G.isUndefined(index) ? this.data.index : parseInt(index);
            var self = this;
            this.dom.picPreviewSync.removeClass('hide');
            this.dom.picPreviewSync.startTransition('show' , function(){
                // 还原之前的，硬性规定
                self.origin(self.data.index);
                // 设定
                self.data.index = index;
                self.initDynamic(true);
            });
        } ,

        hide: function(){
            var self = this;
            this.dom.picPreviewSync.endTransition('show' , function(){
                self.dom.picPreviewSync.addClass('hide');
            })
        } ,

        initStatic: function(){
            var self = this;
            this.dom.win = G(window);
            this.dom.html = G(document.documentElement);
            this.dom.body = G(document.body);
            this.dom.picPreviewSync = G('.pic-preview-sync' , this.dom.root.get(0));
            this.dom.preview = G('.preview' , this.dom.picPreviewSync.get(0));
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

            this.dom.sImages = G('.s-images' , this.dom.picPreviewSync.get(0));
            this.dom.title = G('.title' , this.dom.sImages.get(0));
            this.dom.closeInSImage = G('.close' , this.dom.title.get(0));
            this.dom.list = G('.list' , this.dom.sImages.get(0));

            var i = 1;
            this.dom.itemsForBImages.each(function(item){
                item = G(item);
                item.data('index' , i++);
                self.dom.list.append(item.clone().get(0));
            });

            this.dom.itemsForSImages = G('.item' , this.dom.sImages.get(0));

            this.switchSpreadOrShrink(this.option.previewStatus);
            this.switchFullOrNormalScreen(this.option.screenStatus);

            this.data = {
                images: [] ,
                translateX: 0 ,
                position: [] ,
                index: this.option.index ,
                maxIndex: this.dom.itemsForBImages.length ,
                minIndex: 1 ,
                css: {
                    horizontal: 'translate(-50% , -50%)' ,
                    vertical: 'translate(-50% , 0%)' ,
                    nature: 'translate(-50% , -50%)' ,
                    transition: 'all 0.3s' ,
                    noTransition: 'all 0s' ,
                } ,
                minScale: 0.6 ,
                canMove: false ,
                mouseUpX: 0 ,
                mouseUpY: 0 ,
                timer: null ,
            };

            if (this.option.visibility === 'hidden') {
                this.dom.picPreviewSync.removeClass('show');
                this.dom.picPreviewSync.addClass('hide');
            } else {
                this.dom.picPreviewSync.removeClass('hide');
                this.dom.picPreviewSync.addClass('show');
            }
        } ,

        initDynamic: function(transition){
            transition = G.isBoolean(transition) ? transition : true;
            var self = this;
            this.data.position = [];

            this.data.bImagesW = this.dom.bImages.getTW();
            this.data.bImagesH = this.dom.bImages.getTH();

            var i = 0;
            var loaded = 0;
            this.data.clientH = this.dom.html.clientHeight();
            this.dom.itemsForBImages.each(function(item){
                item = G(item);
                var image = G('.image' , item.get(0));
                image.data('scale' , 1);

                self.data.position[i] = - i * self.data.bImagesW;
                i++;

                var initImage = function(width , height){
                    width = parseInt(width);
                    height = parseInt(height);
                    image.data('width' , width);
                    image.data('height' , height);
                    image.data('done' , 'true');
                    item.removeClass(['horizontal' , 'vertical' , 'nature']);
                    if (width > height) {
                        item.addClass('horizontal');
                        item.data('placement' , 'horizontal');
                        image.css({
                            transform: self.data.css.horizontal
                        });
                    } else {
                        if (height < self.data.clientH) {
                            item.addClass('nature');
                            item.data('placement' , 'nature');
                            image.css({
                                transform: self.data.css.nature
                            });
                        } else {
                            item.addClass('vertical');
                            item.data('placement' , 'vertical');
                            image.css({
                                transform: self.data.css.vertical
                            });
                        }
                    }
                    loaded++;
                    if (loaded === self.dom.itemsForBImages.length) {
                        self.index(self.data.index , transition);
                    }
                };
                if (image.data('done') !== 'true') {
                    var img = new Image();
                    img.onload = function(){
                        initImage(this.width , this.height);
                    };
                    img.src = image.native('src');
                } else {
                    initImage(image.data('width') , image.data('height'));
                }
            });
        } ,

        init: function(){
            // this.setBImagesTranslateXByIndex(this.data.index);
            // this.info(this.data.index);
            // this.focusByIndex(this.data.index);
            // this.origin(this.data.index);

            this.showTool();
            this.hideTool();
        } ,

        getImageInItem: function(item){
            return G('.image' , item).get(0);
        } ,

        setBImagesTranslateXByIndex: function(index){
            this.dom.bImages.css({
                transform: 'translateX(' + this.data.position[index - 1] + 'px)'
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
                    this.dom.picPreviewSync.addClass('full');
                    break;
                case 'narrow':
                    this.dom.spread.removeClass('hide');
                    this.dom.close.removeClass('hide');
                    this.dom.narrow.addClass('hide');
                    this.dom.picPreviewSync.removeClass('full');
                    break;
                default:
                    throw new Error('不支持的状态');
            }
            this.dom.preview.onTransition(function(){
                self.initDynamic();
            });

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
                    this.dom.picPreviewSync.requestFullScreen();
                    this.dom.fullScreen.addClass('hide');
                    this.dom.normalScreen.removeClass('hide');
                    break;
                case 'normal':
                    this.dom.picPreviewSync.exitFullScreen();
                    this.dom.fullScreen.removeClass('hide');
                    this.dom.normalScreen.addClass('hide');
                    break;
                default:
                    throw new Error('不支持的状态');
            }
            this.dom.preview.onTransition(function(){
                self.initDynamic();
            });
        } ,

        prev: function(){
            if (this.data.index <= this.data.minIndex) {
                this.message('已经是首张图片~');
                return ;
            }
            this.origin(this.data.index);
            this.data.index--;
            this.setBImagesTranslateXByIndex(this.data.index);
            this.info(this.data.index);
            this.focusByIndex(this.data.index);
        } ,

        next: function(){
            if (this.data.index >= this.data.maxIndex) {
                console.log('到底了');
                this.message('到底了~');
                return ;
            }
            this.origin(this.data.index);
            this.data.index++;
            this.setBImagesTranslateXByIndex(this.data.index);
            this.info(this.data.index);
            this.focusByIndex(this.data.index);
        } ,

        index: function(index , transition , scroll){
            transition = G.isBoolean(transition) ? transition : true;
            scroll = G.isBoolean(scroll) ? scroll : true;
            var self = this;
            this.origin(this.data.index);
            this.data.index = index;
            if (!transition) {
                this.dom.bImages.css({
                    transition: this.data.css.noTransition
                });
                this.setBImagesTranslateXByIndex(this.data.index);
                G.nextTick(function(){
                    self.dom.bImages.css({
                        transition: self.data.css.transition
                    });
                });
            } else {
                this.setBImagesTranslateXByIndex(this.data.index);
            }
            this.info(this.data.index);
            this.focusByIndex(this.data.index , scroll);
        } ,

        focusByIndex: function(index , scroll){
            scroll = G.isBoolean(scroll) ? scroll : true;
            var indexDom = this.dom.itemsForSImages.jump(index - 1 , true);
            // 选中项
            indexDom.highlight('cur' , this.dom.itemsForSImages.get());
            if (scroll) {
                var floor = Math.ceil(index / 2);
                var margin = (floor - 1 ) * parseInt(indexDom.getStyleVal('marginBottom'));
                var top = floor * indexDom.height('border-box') + margin;
                var listH = this.dom.list.height('content-box');
                if (top <= listH) {
                    this.dom.list.scrollTop(0);
                } else {
                    var halfListH = listH / 2;
                    this.dom.list.scrollTop(top - listH + halfListH);
                }
            }
        } ,

        indexEvent: function(e){
            var tar = G(e.currentTarget);
            var index = tar.data('index');
            this.index(index , true , false);
        } ,

        grow: function(amount){
            var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
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
            var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
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
            var item = this.dom.itemsForBImages.jump(index - 1 , true);
            var placement = item.data('placement');
            var image = G('.image' , item.get(0));
            image.data('scale' , 1);
            image.css({
                transform: this.data.css[placement]
            });
        } ,

        originEvent: function(){
            this.origin(this.data.index);
        } ,

        imageMouseDownEvent: function(e){
            G.prevent(e);
            this.data.canMove = true;

            var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
            var image = G('.image' , item.get(0));
            image.addClass('grab');

            var transform = image.getStyleVal('transform');
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


            var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
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
            var item = this.dom.itemsForBImages.jump(this.data.index - 1 , true);
            var image = G('.image' , item.get(0));
            var placement = item.data('placement');
            var transform = image.getStyleVal('transform');
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
            if (scaleImageW < this.data.bImagesW && scaleImageH < this.data.bImagesH) {
                // 还原
                endTransform = this.data.css[placement] + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else if (scaleImageW < this.data.bImagesW) {
                // 水平居中
                maxY = yMoveRange;
                minY = -yMoveRange;
                this.data.sTranslateY = Math.max(minY , Math.min(maxY , this.data.sTranslateY));
                endTransform = 'translate(-50% , ' + this.data.sTranslateY +'px)' + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else if (scaleImageH < this.data.bImagesH) {
                // 垂直居中
                this.data.sTranslateX = Math.max(minX , Math.min(maxX , this.data.sTranslateX));
                endTransform = 'translate(' + this.data.sTranslateX + 'px , -50%)' + ' scale(' + this.data.scaleX + ', ' + this.data.scaleY + ')';
            } else {
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
            this.dom.itemsForSImages.on('click' , this.indexEvent.bind(this));
            this.dom.grow.on('click' , this.grow.bind(this , 1));
            this.dom.shrink.on('click' , this.shrink.bind(this , 1));
            this.dom.origin.on('click' , this.originEvent.bind(this));
            this.dom.imagesForBImages.on('click' , G.stop);

            this.dom.imagesForBImages.on('dblclick' , this.originEvent.bind(this));
            this.dom.imagesForBImages.on('mousedown' , this.imageMouseDownEvent.bind(this));
            this.dom.win.on('mousemove' , this.imageMouseMoveEvent.bind(this));
            this.dom.win.on('mouseup' , this.imageMouseupEvent.bind(this));
            this.dom.win.on('resize' , this.initDynamic.bind(this));
            this.dom.content.on('wheel' , this.wheelEvent.bind(this));
            this.dom.content.on('mousemove' , this.contentMouseMoveEvent.bind(this));
            this.dom.close.on('click' , this.hide.bind(this));
            this.dom.closeInSImage.on('click' , this.hide.bind(this));
            // this.dom.content.on('click' , this.hide.bind(this));
            this.dom.header.on('click' , G.stop);


            this.dom.win.on('keyup' , function(e){
                // console.log('keycode' , e.keyCode);
                if (e.keyCode !== 27) {
                    return ;
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
                    div.parent().remove(div.get(0));
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

    window.PicPreview_Sync = PicPreview_Sync;
})();