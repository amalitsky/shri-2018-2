(function(): void {
    'use strict';

    /**
     * True when dragging action is active.
     */
    let dragInProgress: boolean = false;

    /**
     * Pointer id which kicked off the dragging action. Used only on switch from dragging to scaling.
     */
    let dragPointerId: number = NaN;

    /**
     * Previous pointer position during dragging.
     */
    let dragPrevPosition: Coordinate = [
        NaN,
        NaN
    ];

    /**
     * True when scaling action is active.
     */
    let scaleInProgress: boolean = false;

    /**
     * Value of the current image scale. Can be changed by scaling action.
     */
    let currentScale: number = 1;

    /**
     * Two initial positions (reactive to the img element) of user's fingers. Set on
     * pointerdown event only and don't change during the scaling action.
     */
    const scalingPreviousPos: [Coordinate, Coordinate] = [
        [NaN, NaN],
        [NaN, NaN]
    ];

    /**
     * Pointer ids of the scaling action.
     */
    const scalePointerIds: {0: number, 1: number} = {
        0: NaN,
        1: NaN
    };

    let viewport: HTMLDivElement;
    let vpWidth: number;
    let vpHeight: number;
    let vpTop: number;
    let vpLeft: number;
    let img: HTMLImageElement;
    let imgWidth: number;
    let imgHeight: number;

    /**
     * Current left and top margins of the image, set though 'transform: translate'.
     * @type {number[]}
     */
    const imgPosition: [number, number] = [
        0,
        0
    ];

    /**
     * Event handler for the viewport resizing event.
     */
    function onWindowSizeChange(): void {
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;

        vpWidth = viewport.offsetWidth;
        vpHeight = viewport.offsetHeight;

        vpTop = viewport.offsetTop;
        vpLeft = viewport.offsetLeft;
    }

    /**
     * Calculates distance between two points.
     */
    function getDistance(pointA: Coordinate, pointB: Coordinate): number {
        const dX = Math.abs(pointA[0] - pointB[0]);
        const dY = Math.abs(pointA[1] - pointB[1]);

        return Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    }

    /**
     * Coverts viewport coordinates to coordinates relative to img top left corner.
     */
    function getImgRelativePos([clientX, clientY]: Coordinate): Coordinate {
        const posX = (clientX - vpLeft - imgPosition[0]) / currentScale;
        const posY = (clientY - vpTop - imgPosition[1]) / currentScale;

        return [
            posX,
            posY
        ];
    }

    /**
     * Usually we have to move image by both axes after the scale change. This is due to the
     * fact that we want to keep image points initially picked by the user on `pointerdown` events
     * under his fingers while scaling the image.
     */
    function getScalingShift(
        [initX, initY]: Coordinate,
        currentScale: number,
        scale: number
    ): Coordinate {
        const dX = -initX * (scale - currentScale);
        const dY = -initY * (scale - currentScale);

        return [dX, dY];
    }

    /**
     * Updates image margins set through `transform: translate`.
     */
    function moveImage(dx: number, dy: number): void {
        const targetX = imgPosition[0] + dx;
        const targetY = imgPosition[1] + dy;

        setImgTransformation([targetX, targetY]);
    }

    /**
     * Applies actual transformations to the img element and updates global (sic!)
     * scope variables accordingly.
     */
    function setImgTransformation(translate: Coordinate = imgPosition, scale: number = currentScale): void {
        const value = `translate(${translate[0]}px, ${translate[1]}px) scale(${scale})`;

        imgPosition[0] = translate[0];
        imgPosition[1] = translate[1];

        currentScale = scale;

        img.style.transform = value;
    }

    /**
     * Called to perform image scaling and moving.
     */
    function performImgScaling(translationShift: Coordinate, scale: number): void {
        const translation = [
            imgPosition[0] + translationShift[0],
            imgPosition[1] + translationShift[1]
        ] as Coordinate;

        setImgTransformation(translation, scale);
    }

    /**
     * Pointer move event handler.
     */
    function onPointerMove(e: PointerEvent): void {
        const {
            clientX,
            clientY,
            pointerId
        } = e;

        if (dragInProgress) {
            const [startX, startY] = dragPrevPosition;
            moveImage(clientX - startX, clientY - startY);
            dragPrevPosition = [clientX, clientY];

        } else if (scaleInProgress) {
            const index = pointerId === scalePointerIds[0] ? 0 : 1;
            const anchorIndex = index ? 0 : 1;

            const movingPointPrevPos = scalingPreviousPos[index];
            const anchorPos = scalingPreviousPos[anchorIndex];
            const movingPointPos = getImgRelativePos([clientX, clientY]);

            const scaleChange =
                getDistance(anchorPos, movingPointPos) /
                getDistance(anchorPos, movingPointPrevPos);

            const scale = currentScale * scaleChange;

            performImgScaling(
                getScalingShift(anchorPos, currentScale, scale),
                scale
            );
        }
    }

    /**
     * Pointer down event handler.
     * @param {MouseEvent} e
     */
    function onPointerDown(e: PointerEvent): void {
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
            scalingPreviousPos[0] = getImgRelativePos(dragPrevPosition);

            scalePointerIds[1] = pointerId;
            scalingPreviousPos[1] = getImgRelativePos([clientX, clientY]);
        }
    }

    /**
     * Resets internal app state to allow for the clean start once requested.
     */
    function onPointerGone(): void {
        cancelDragging();
        cancelScaling();
    }

    /**
     * Cleans dragging action scope variables.
     */
    function cancelDragging(): void {
        dragInProgress = false;
        dragPointerId = NaN;
        dragPrevPosition[0] = NaN;
        dragPrevPosition[1] = NaN;
    }

    /**
     * Cleans scaling action scope variables.
     */
    function cancelScaling(): void {
        scaleInProgress = false;

        scalePointerIds[0] = NaN;
        scalePointerIds[1] = NaN;

        scalingPreviousPos[0] = [
            NaN,
            NaN
        ];

        scalingPreviousPos[1] = [
            NaN,
            NaN
        ];
    }

    /**
     * Sets up event handlers and runs some initialization functions.
     */
    function init(): void {
        viewport = document.querySelector('.window') as HTMLDivElement;
        img = viewport.querySelector('img')!;

        onWindowSizeChange();

        // rendering image vertically and horizontally centered
        moveImage(
            -(imgWidth - vpWidth) / 2,
            -(imgHeight - vpHeight) / 2
        );

        viewport.addEventListener('pointermove', onPointerMove);
        viewport.addEventListener('pointerup', onPointerGone);
        viewport.addEventListener('pointerdown', onPointerDown);
        viewport.addEventListener('pointerleave', onPointerGone);
        viewport.addEventListener('pointercancel', onPointerGone);
    }

    window.addEventListener('load', init);
    window.addEventListener('resize', onWindowSizeChange);
})();

