(function(){
    "use strict";

    let prev = G('#prev');
    let next = G('#next');

    let outer = G('#outer');
    let inner = G('#inner');
    let items = inner.children();
    const maxIndex = items.length - 1;
    const minIndex = 0;
    const outerW = outer.width('content-box');

    inner.css({
         width: 50 * items.length + 'px'
    });

    let position = 0;

    let find = () => {
        for (let i = 0; i < items.length; ++i)
        {
            let cur = items.jump(i , true);
            if (cur.hasClass('cur')) {
                return i;
            }
        }
        return -1;
    };

    let findWithDom = (index) => {
        return items.jump(index , true);
    };

    let getLeftVal = (index) => {
        let dom = findWithDom(index);
        let prevSiblings = dom.prevSiblings();
        let left = 0;
        for (let i = 0; i < prevSiblings.length; ++i)
        {
            let cur = prevSiblings.jump(i , true);
            left += cur.width('border-box');
        }
        return left;
    };

    let getMiddleLeftVal = (index) => {
        let dom = findWithDom(index);
        let domW = dom.width('border-box');
        return (outerW - domW) / 2;
    };

    let switchEvent = (type) => {
        let curPos = find();
        let endPos = type == 'next' ? curPos + 1 : curPos - 1;
        endPos = Math.max(minIndex , Math.min(maxIndex , endPos));
        const leftVal = getLeftVal(endPos);
        const middleLeftVal = getMiddleLeftVal(endPos);
        const startX = outer.scrollLeft();
        let endX = 0;
        if (leftVal > middleLeftVal) {
            endX = startX;
            const amount = leftVal - middleLeftVal;
            if (type == 'next') {
                endX += amount;
            } else {
                endX -= amount;
            }
            endX = amount;
            console.log(leftVal , middleLeftVal , startX , endX , amount);
        } else {
            endX = 0;
        }
        outer.hScroll(300 , endX , () => {
            findWithDom(endPos).highlight("cur" , items.get());
            console.log("水平滚动完毕");
        });
    };

    prev.on("click" , () => {
        switchEvent("prev");
    } , false , true);
    next.on("click" , () => {
        switchEvent("next");
    } , false , true);
})();