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

    const scalingCenter = [
        NaN, NaN
    ];

    let viewport,
        vpWidth,
        vpHeight,
        img,
        imgWidth,
        imgHeight;

    let objectPosition = [0, 0];

    function onWindowSizeChange() {
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;

        vpWidth = viewport.offsetWidth;
        vpHeight = viewport.offsetHeight;

        minXtransition = -1 * Math.max(0, imgWidth - vpWidth);
        minYtransition = -1 * Math.max(0, imgHeight - vpHeight);

        console.log(minXtransition, minYtransition);
    }

    function init() {
        viewport = document.querySelector('.window');
        img = viewport.querySelector('img');

        onWindowSizeChange();

        function updateImgPosition(dx, dy) {
            let targetX = objectPosition[0] + dx;
            let targetY = objectPosition[1] + dy;

            if (targetX > 0) {
                targetX = 0;
            } else if (targetX < minXtransition) {
                targetX = minXtransition;
            }

            if (targetY > 0) {
                targetY = 0;
            } else if (targetY < minYtransition) {
                targetY = minYtransition;
            }

            objectPosition[0] = targetX;
            objectPosition[1] = targetY;

            img.style.transform = `translate(${targetX}px, ${targetY}px)`;
            console.log(`x: ${targetX}, y: ${targetY}`);
        }

        updateImgPosition(
            -(imgWidth - vpWidth) / 2,
            -(imgHeight - vpHeight) / 2
        );

        function scaleAndMove(anchor, start, end) {
            //figuring scale
            //moving pic to meet anchor again
        }

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
                if (Number.isNaN(scalingPreviousPos[0][0])) {
                    scalePointerIds[0] = pointerId;

                    scalingPreviousPos[0] = [
                        clientX,
                        clientY
                    ];

                    console.log('fist scaling pointer captured');
                } else if (Number.isNaN(scalingPreviousPos[1][0])) {
                    scalePointerIds[1] = pointerId;

                    scalingPreviousPos[1] = [
                        clientX,
                        clientY
                    ];

                    setScalingCenter();
                    console.log('second scaling pointer captured');
                } else {
                    console.log('scaling in progress');

                    const index = pointerId === scalePointerIds[0] ? 0 : 1;

                    const deltaX = clientX - scalingPreviousPos[index][0];
                    const deltaY = clientY - scalingPreviousPos[index][1];

                    const xScale = deltaX / (imgWidth * currentScale);
                    const yScale = deltaY / (imgHeight * currentScale);

                    console.log(xScale, yScale);

                    scalingPreviousPos[index][0] = clientX;
                    scalingPreviousPos[index][1] = clientY;

                    setScalingCenter();
                }
            }
        }

        function setScalingCenter() {
            const [one, two] = scalingPreviousPos;
            scalingCenter[0] = (one[0] + two[0]) / 2;
            scalingCenter[1] = (one[1] + two[1]) / 2;
        }

        function onPointerDown(e) {
            const {clientX, clientY} = e;

            if (!dragInProgress) {
                dragInProgress = true;
            } else {
                dragInProgress = false;
                scaleInProgress = true;
            }

            dragPrevPosition = [clientX, clientY];
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
            if (dragInProgress) {
                dragInProgress = false;
                dragPrevPosition[0] = NaN;
                dragPrevPosition[1] = NaN;
            }
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

                scalingCenter[0] = NaN;
                scalingCenter[1] = NaN;

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

    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('resize', onWindowSizeChange);
})();

