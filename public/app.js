(function () {
    'use strict';

    const
        minScale = 0.5,
        maxScale = minScale * minScale;

    let
        minXtransition = 0,
        minYtransition = 0;

    let dragInProgress = false;

    let scaleInProgress = false;

    let dragPrevPosition = [
        NaN,
        NaN
    ];

    let currentScale = 1;

    const scalingPreviousPos = [
        [NaN, NaN],
        [NaN, NaN]
    ];

    const scalePointerIds = {
        0: NaN,
        1: NaN
    };

    let viewport,
        vpWidth,
        vpHeight,
        vpTop,
        vpLeft,
        img,
        imgWidth,
        imgHeight;

    let objectPosition = [0, 0];

    function onWindowSizeChange() {
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;

        vpWidth = viewport.offsetWidth;
        vpHeight = viewport.offsetHeight;
        vpTop = viewport.offsetTop;
        vpLeft = viewport.offsetLeft;

        minXtransition = -1 * Math.max(0, imgWidth - vpWidth);
        minYtransition = -1 * Math.max(0, imgHeight - vpHeight);

        console.log(`min X: ${minXtransition} minY: ${minYtransition}`);
    }

    function getDistance(pointA, pointB) {
        const dX = Math.abs(pointA[0] - pointB[0]);
        const dY = Math.abs(pointA[1] - pointB[1]);
        return Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    }

    function getImgPosCoordinates([clientX, clientY]) {
        const posX = (clientX - vpLeft - objectPosition[0]) / currentScale;
        const posY = (clientY - vpTop - objectPosition[1]) / currentScale;

        return [
            posX,
            posY
        ];
    }

    function getScalingShift([initX, initY], currentScale, scale) {
        const dX = -initX * (scale - currentScale);
        const dY = -initY * (scale - currentScale);

        return [dX, dY];
    }

    function updateImgPosition(dx, dy) {
        let targetX = objectPosition[0] + dx;
        let targetY = objectPosition[1] + dy;

        /*if (targetX > 0) {
            targetX = 0;
        } else if (targetX < minXtransition) {
            targetX = minXtransition;
        }

        if (targetY > 0) {
            targetY = 0;
        } else if (targetY < minYtransition) {
            targetY = minYtransition;
        }*/

        setImgTransformation([targetX, targetY]);
    }

    function setImgTransformation(translate = objectPosition, scale = currentScale) {
        const value = `translate(${translate[0]}px, ${translate[1]}px) scale(${scale})`;

        objectPosition[0] = translate[0];
        objectPosition[1] = translate[1];

        currentScale = scale;

        img.style.transform = value;
        console.log(value);
    }

    function performImgScaling(translationShit, scale) {
        const translation = [
            objectPosition[0] + translationShit[0],
            objectPosition[1] + translationShit[1]
        ];

        setImgTransformation(translation, scale);
    }

    function init() {
        viewport = document.querySelector('.window');
        img = viewport.querySelector('img');

        onWindowSizeChange();

        updateImgPosition(
            -(imgWidth - vpWidth) / 2,
            -(imgHeight - vpHeight) / 2
        );

        //setImgTransformation(undefined, 0.5);

        function onPointerMove(e) {
            const {
                clientX,
                clientY,
                pointerId
            } = e;

            if (dragInProgress) {
                const [startX, startY] = dragPrevPosition;
                updateImgPosition(clientX - startX, clientY - startY);
                dragPrevPosition = [clientX, clientY];
            } else if (scaleInProgress) {
                console.log('scaling in progress');

                const index = pointerId === scalePointerIds[0] ? 0 : 1;
                console.log('index', index);

                const anchorIndex = index ? 0 : 1;

                const movingPointPos = getImgPosCoordinates([clientX, clientY]);
                const movingPointPrevPos = scalingPreviousPos[index];
                const anchorPos = scalingPreviousPos[anchorIndex];

                console.log(
                    anchorPos.concat(),
                    movingPointPos.concat(),
                    movingPointPrevPos.concat(),
                    getDistance(anchorPos, movingPointPos),
                    getDistance(anchorPos, movingPointPrevPos)
                );

                const scale =
                    getDistance(anchorPos, movingPointPos) /
                    getDistance(anchorPos, movingPointPrevPos);

                console.log(`scale change: `, scale);
                console.log(`transform change: `, getScalingShift(anchorPos, currentScale, scale * currentScale));

                //scalingPreviousPos[index] = movingPointPos;

                /*console.log(
                    movingPointPos
                );*/

                performImgScaling(
                    getScalingShift(anchorPos, currentScale, scale * currentScale),
                    scale * currentScale
                );
            }
        }

        let dragPointerId = NaN;

        function onPointerDown(e) {
            const {
                clientX,
                clientY,
                pointerId
            } = e;

            if (!dragInProgress) {
                dragInProgress = true;
                dragPrevPosition = [
                    clientX,
                    clientY
                ];

                dragPointerId = pointerId;
            } else {
                dragInProgress = false;
                scaleInProgress = true;

                scalePointerIds[0] = dragPointerId;
                scalingPreviousPos[0] = getImgPosCoordinates(dragPrevPosition);

                scalePointerIds[1] = pointerId;
                scalingPreviousPos[1] = getImgPosCoordinates([clientX, clientY]);
            }
        }

        function onPointerGone() {
            cancelDragging();
            cancelScaling();
        }

        function onPointerLeave() {
            console.log('leave');
            onPointerGone();
        }

        function onPointerCancel() {
            console.log('cancel');
            onPointerGone();
        }

        function onPointerUp() {
            console.log('cancel');
            onPointerGone();
        }

        function cancelDragging() {
            dragInProgress = false;
            dragPrevPosition[0] = NaN;
            dragPrevPosition[1] = NaN;
            dragPointerId = NaN;
        }

        function cancelScaling() {
            if (scaleInProgress) {
                scaleInProgress = false;

                scalingPreviousPos[0] = [
                    NaN, NaN
                ];
                scalingPreviousPos[1] = [
                    NaN, NaN
                ];

                scalePointerIds[0] = NaN;
                scalePointerIds[1] = NaN;
            }
        }

        viewport.addEventListener('pointermove', onPointerMove);
        viewport.addEventListener('pointerup', onPointerUp);
        viewport.addEventListener('pointerdown', onPointerDown);
        viewport.addEventListener('pointerleave', onPointerLeave);
        viewport.addEventListener('pointercancel', onPointerCancel);
    }

    window.addEventListener('load', init);
    window.addEventListener('resize', onWindowSizeChange);
})();

