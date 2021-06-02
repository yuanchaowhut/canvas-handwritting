var canvasWidth = Math.min(800, $(window).width() - 60);
var canvasHeight = canvasWidth;
var isMouseDown = false;
var lastLocation, lastTimeStamp;
var maxLineWidth = 30, minLineWidth = 1;
var maxSpeed = 10, minSpeed = 0.1;
var lastLineWidth = -1;
var strokeColor = "black";

window.onload = function () {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    $("#controller").css("width", canvasWidth + "px");

    drawGrid(context);

    initEvents(context);
}

//绘制米字格函数
function drawGrid(context) {
    context.save();

    context.strokeStyle = "rgb(230,11,9)";

    //绘制一个margin:3的正方形
    context.beginPath();
    context.moveTo(3, 3);  //为什么是3? 因为正方形边框宽度是6，这个6内外各占3像素
    context.lineTo(canvasWidth - 3, 3);
    context.lineTo(canvasWidth - 3, canvasHeight - 3);
    context.lineTo(3, canvasHeight - 3);
    context.closePath();

    context.lineWidth = 6;
    context.stroke();

    //绘制2条对角线+2条中线
    context.setLineDash([3]);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(canvasWidth, canvasHeight);

    context.moveTo(canvasWidth, 0);
    context.lineTo(0, canvasHeight);

    context.moveTo(canvasWidth / 2, 0);
    context.lineTo(canvasWidth / 2, canvasHeight);

    context.moveTo(0, canvasHeight / 2);
    context.lineTo(canvasWidth, canvasHeight / 2);

    context.lineWidth = 1;
    context.stroke();

    context.restore();
}

function initEvents(context) {
    //清除按钮事件
    $("#clear_btn").click(
        function (e) {
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            drawGrid(context)
        }
    )

    //选择颜色按钮事件
    $(".color_btn").click(
        function (e) {
            $(".color_btn").removeClass("color_btn_selected")
            $(this).addClass("color_btn_selected")
            strokeColor = $(this).css("background-color")
        }
    )

    var canvas = context.canvas;

    canvas.onmousedown = function (e) {
        e.preventDefault();
        isMouseDown = true;
        lastLocation = windowToCanvas(canvas, {x: e.clientX, y: e.clientY});
        lastTimeStamp = new Date().getTime();
    }

    canvas.onmouseup = function (e) {
        e.preventDefault();
        isMouseDown = false;
    }

    canvas.onmouseout = function (e) {
        e.preventDefault();
        isMouseDown = false;
    }

    canvas.onmousemove = function (e) {
        e.preventDefault();
        if (isMouseDown) {
            var point = {x: e.clientX, y: e.clientY};
            handleStroke(context, point);
        }
    }

    //移动端事件
    canvas.addEventListener("touchstart", function (e) {
        e.preventDefault();
        isMouseDown = true;
        var touch = e.touches[0];
        lastLocation = windowToCanvas(canvas, {x: touch.pageX, y: touch.pageY});
        lastTimeStamp = new Date().getTime();
    })

    canvas.addEventListener("touchmove", function (e) {
        if (isMouseDown) {
            var touch = e.touches[0];
            var point = {x: touch.pageX, y: touch.pageY};
            handleStroke(context, point);
        }
    })

    canvas.addEventListener("touchend", function (e) {
        e.preventDefault();
        isMouseDown = false;
    })
}

function handleStroke(context, point) {
    var curLocation = windowToCanvas(context.canvas, point);
    var curTimeStamp = new Date().getTime();

    //计算两个点之间的距离和时间
    var s = calcDistance(lastLocation, curLocation);
    var t = curTimeStamp - lastTimeStamp;

    //根据距离和时间获得合适的线条宽度
    lastLineWidth = calcLineWidth(s, t);

    drawLine(context, lastLocation, curLocation, lastLineWidth);

    lastLocation = curLocation;
    lastTimeStamp = curTimeStamp;
}


/**
 * 将相对于document的坐标转换为相对于画布的坐标
 * @param element
 * @param point
 * @returns {{x: number, y: number}}
 */
function windowToCanvas(element, point) {
    var rect = element.getBoundingClientRect();
    return {x: point.x - rect.left, y: point.y - rect.top};
}

/**
 * 计算两个点之间的间距
 * @param loc1
 * @param loc2
 * @returns {number}
 */
function calcDistance(loc1, loc2) {
    return Math.sqrt((loc1.x - loc2.x) * (loc1.x - loc2.x) + (loc1.y - loc2.y) * (loc1.y - loc2.y));
}

/**
 * 根据距离s和时间t，通过一定的算法计算得到合适的lineWidth
 * @param s
 * @param t
 */
function calcLineWidth(s, t) {
    var v = s / t;
    var result;
    if (v <= minSpeed) {
        result = maxLineWidth;
    } else if (v >= maxSpeed) {
        result = minLineWidth;
    } else {
        //让 v-minSpeed/(maxSpeed-minSpeed) = (maxLineWidth-?)/(maxLineWidth-minLineWidth)
        result = maxLineWidth - (v - minSpeed) / (maxSpeed - minSpeed) * (maxLineWidth - minLineWidth);
    }
    if (lastLineWidth !== -1) {
        result = result / 3 + 2 * lastLineWidth / 3;
    }
    return result;
}

/**
 * 绘制两个点之间的直线，对于间距极短的2个点之间画直线，肉眼看来就是平滑曲线
 * @param context
 * @param lastLoc
 * @param curLoc
 * @param lineWidth
 */
function drawLine(context, lastLoc, curLoc, lineWidth) {
    context.beginPath();
    context.moveTo(lastLoc.x, lastLoc.y);
    context.lineTo(curLoc.x, curLoc.y);

    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
}

