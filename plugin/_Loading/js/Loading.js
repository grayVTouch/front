/**
 * @title 加载动画
 * @author 陈学龙 2019-01-13
 */
(function(){
    'use strict';

    function Loading(container , option){
        if (!G.isObject(option)) {
            option = this.default;
        }
        this.dom.container = G(container);
        this.option.status = G.contain(option.status , this.status) ? option.status : this.default.status;
        this.run();
    }

    Loading.prototype = {
        constructor: Loading ,
        status: ['show' , 'hide'] ,
        default: {
            // show | hide
            status: 'hide'
        } ,
        // 实际配置文件
        option: {} ,
        dom: {} ,
        val: {} ,
        initStaticArgs () {
            this.dom.background = G('.background' , this.dom.container.get(0));
        } ,
        initStatic () {
            if (this.option.status == 'show') {
                this.show();
            } else {
                this.hide();
            }
        } ,
        initDynamicArgs () {

        } ,
        initDynamic () {

        } ,
        initEvent () {

        } ,

        show () {
            this.dom.container.removeClass('hide');
            this.dom.container.animate({
                opacity: 0.8
            });
        } ,

        hide () {
            this.dom.container.animate({
                opacity: 0
            } , () => {
                this.dom.container.addClass('hide');
            });
        }  ,

        run () {
            this.initStaticArgs();
            this.initStatic();
            this.initDynamicArgs();
            this.initDynamic();
            this.initEvent();
        }
    };

    window.Loading = Loading;
})();