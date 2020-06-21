(function(){
    function Ripple(selector , option)
    {
        this.dom = {
            root: G(selector)
        };
        if (!this.dom.root.isDom()) {
            throw new Error('参数 1 错误');
        }
        this.default = {};
        if (!G.isValid(option)) {
            option = this.default;
        }
        this.option = {};
        this.run();
    }

    Ripple.prototype = {

        initStatic: function(){

        } ,

        initDynamic: function(){

        } ,

        clickEvent: function(e){
            var x = e.clientX;
            var y = e.clientY;
            this.ripple(x , y);
        } ,

        ripple: function(x , y){
            var div = document.createElement('div');
            div = G(div);
            div.addClass('__ripple__');
            var inner = document.createElement('div');
            inner = G(inner);
            inner.addClass('inner');
            div.append(inner.get(0));
            this.dom.root.append(div.get(0));

            var rootX = this.dom.root.getWindowOffsetVal('left');
            var rootY = this.dom.root.getWindowOffsetVal('top');

            var leftVal = Math.abs(x - rootX);
            var topVal = Math.abs(y - rootY);

            inner.css({
                transformOrigin: leftVal + 'px ' + topVal + 'px' ,
            });

            inner.startTransition('scale' , function(){
                // div.parent().remove(div.get(0));
            });
        } ,

        initEvent: function(){
            this.dom.root.on('click' , this.clickEvent.bind(this));
        } ,

        run: function () {
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        }
    };

    window.Ripple = Ripple;
})();