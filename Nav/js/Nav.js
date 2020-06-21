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
        };
        if (!G.isValid(option)) {
            option = this.default;
        }
        this.option = {};
        this.option.click = G.isFunction(option.click) ? option.click : this.default.click;

        this.run();
    }

    Nav.prototype = {

        initStatic: function(){
            var self = this;

            this.dom.nav    = G('.__nav__' , this.dom.root.get(0));
            this.dom.lists  = G('.list' , this.dom.nav.get(0));
            this.dom.firstList   = G('.list' , this.dom.nav.get(0)).first();
            this.dom.items  = G('.item' , this.dom.nav.get(0));

            this.dom.lists.each(function(dom){
                dom = G(dom);
                if (dom.equals(self.dom.firstList.get(0))) {
                    return ;
                }
                dom.addClass('hide');
            });

            this.dom.items.each(function(item){
                item = G(item);
                var action  = G('.action' , item.get(0)).first();
                var ico     = G('.ico' , action.get(0)).first();
                var list    = G('.list' , item.get(0)).first();
                if (list.children().length > 0) {
                    ico.removeClass('hide');
                }
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

        clickEvent: function(e){
            var tar = G(e.currentTarget);
            if (G.isFunction(this.option.click)) {
                G.invoke(this.option.click , this , tar.get(0));
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