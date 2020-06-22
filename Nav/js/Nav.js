(function(){
    "use strict";

    function Nav(selector , option)
    {
        this.dom = {
            root: G(selector)
        };
        if (!this.dom.root.isDom()) {
            throw new Error('参数 1 错误');
        }
        this.default = {
            click: null ,
            // 是否选中项
            focus: true ,
            // 是否选中顶级项
            topFocus: true ,
            // 初始选中的项
            ids: [] ,
        };
        if (!G.isValid(option)) {
            option = this.default;
        }
        this.option = {};
        this.option.click = G.isFunction(option.click) ? option.click : this.default.click;
        this.option.focus = G.isBoolean(option.focus) ? option.focus : this.default.focus;
        this.option.topFocus = G.isBoolean(option.topFocus) ? option.topFocus : this.default.topFocus;
        this.option.ids = G.isArray(option.ids) ? option.ids : this.default.ids;

        this.run();
    }

    Nav.prototype = {

        initStatic: function(){
            var self = this;

            this.dom.nav    = G('.__nav__' , this.dom.root.get(0));
            this.dom.lists  = G('.list' , this.dom.nav.get(0));
            this.dom.firstList   = G('.list' , this.dom.nav.get(0)).first();
            this.dom.items  = G('.item' , this.dom.nav.get(0));

            this.dom.lists.each(function(list){
                list = G(list);
                if (list.equals(self.dom.firstList.get(0))) {
                    return ;
                }
                list.addClass('hide');
            });

            // 下拉图标初始化
            this.dom.items.each(function(item){
                item = G(item);
                var action  = G('.action' , item.get(0)).first();
                var ico     = G('.ico' , action.get(0)).first();
                var list    = G('.list' , item.get(0)).first();
                if (list.children().length > 0) {
                    ico.removeClass('hide');
                }
            });

            this.option.ids.forEach(function(id){
                self.focusById(id);
            });
        } ,

        initDynamic: function(){} ,

        mouseEnterEvent: function(e){
            var tar = G(e.currentTarget);
            var list = tar.children({
                tagName: 'div' ,
                className: 'list' ,
            }).first();
            tar.addClass('hover');
            list.removeClass('hide');
            list.startTransition('show');
        } ,

        mouseLeaveEvent: function(e){
            var tar = G(e.currentTarget);
            var list = tar.children({
                tagName: 'div' ,
                className: 'list' ,
            }).first();
            tar.removeClass('hover');
            list.endTransition('show' , function () {
                list.addClass('hide');
            });
        } ,

        hide: function() {
            var self = this;
            this.dom.lists.each(function(list){
                list = G(list);
                if (list.equals(self.dom.firstList.get(0))) {
                    return ;
                }
                list.endTransition('show' , function () {
                    list.addClass('hide');
                });
            });
            this.dom.items.each(function (item) {
                item = G(item);
                item.removeClass('hover');
            });
        } ,

        focusByItem: function(item){
            this.dom.items.each(function(item){
                item = G(item);
                item.removeClass('cur');
            });
            item = G(item);
            item.addClass('cur');
            if (this.option.topFocus) {
                var parents = item.parents({
                    tagName: 'div' ,
                    className: 'item' ,
                } , this.dom.nav.get(0) , false , true);
                if (parents.length < 1) {
                    return ;
                }
                parents.last().addClass('cur');
            }
        } ,

        findItemById: function(id){
            var i = 0;
            var item = null;
            for (; i < this.dom.items.length; ++i)
            {
                item = this.dom.items.jump(i , true);
                if (item.data('id') == id) {
                    return item.get(0);
                }
            }
            throw new Error('未找到 id 对应项');
        } ,

        focusById: function(id){
            const item = this.findItemById(id);
            this.focusByItem(item);

        } ,

        clickEvent: function(e){
            G.stop(e);
            var tar = G(e.currentTarget);
            var id = tar.data('id');
            this.focusById(id);
            this.hide();
            if (G.isFunction(this.option.click)) {
                G.invoke(this.option.click , this , id , tar.get(0));
            }
        } ,

        initEvent: function(){
            this.dom.items.on('mouseenter' , this.mouseEnterEvent.bind(this));
            this.dom.items.on('mouseleave' , this.mouseLeaveEvent.bind(this));
            this.dom.items.on('click' , this.clickEvent.bind(this));
        } ,

        run: function () {
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        }
    };

    window.Nav = Nav;
})();