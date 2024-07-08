let imageName = '';

document.getElementById('imageInput').addEventListener('change', handleImage, false);
document.getElementById('splitButton').addEventListener('click', function () {
    if (!image.src) {
        alert('이미지를 올려주세요');
        return;
    }
    drawGrid(); // 분할하기 버튼을 누를 때 분할선 미리보기 갱신
    splitImage();
}, false);

document.getElementById('dropZone').addEventListener('click', () => document.getElementById('imageInput').click());
document.getElementById('dropZone').addEventListener('dragover', handleDragOver, false);
document.getElementById('dropZone').addEventListener('dragleave', handleDragLeave, false);
document.getElementById('dropZone').addEventListener('drop', handleDrop, false);

document.getElementById('columns').addEventListener('input', drawGrid, false);
document.getElementById('rows').addEventListener('input', drawGrid, false);
document.getElementById('downloadAllButton').addEventListener('click', downloadAllPieces, false);

let canvas = document.getElementById('myCanvas');
let ctx = canvas.getContext('2d');
let image = new Image();

function handleImage(e) {
    let reader = new FileReader();
    reader.onload = function (event) {
        image.onload = function () {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);
            drawGrid(); // 이미지가 로드된 후 분할선 미리보기 그리기
            document.getElementById('splitButton').disabled = false; // 이미지 업로드 후 분할하기 버튼 활성화
            document.getElementById('imageContainer').classList.add('background');
        }
        image.src = event.target.result;
    }
    imageName = e.target.files[0].name.split('.')[0]; // 파일 이름 저장 (확장자 제외)
    reader.readAsDataURL(e.target.files[0]);
}

function handleDragOver(event) {
    event.preventDefault();
    document.getElementById('dropZone').classList.add('hover');
}

function handleDragLeave(event) {
    event.preventDefault();
    document.getElementById('dropZone').classList.remove('hover');
}

function handleDrop(event) {
    event.preventDefault();
    document.getElementById('dropZone').classList.remove('hover');
    const file = event.dataTransfer.files[0];
    if (file) {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function (e) {
            img.src = e.target.result;
        }

        img.onload = function () {
            handleResize();
        }
        reader.readAsDataURL(file);
        imageName = file.name.split('.')[0]; // 파일 이름 저장 (확장자 제외)
    }
}

function handleResize() {
    const container = document.getElementById('imageContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    if (image) {
        let resizer = SCALER * Math.min(container.clientWidth / image.width, container.clientHeight / image.height);
        SIZE.width = resizer * image.width;
        SIZE.height = resizer * image.height;
        SIZE.x = canvas.width / 2 - SIZE.width / 2;
        SIZE.y = canvas.height / 2 - SIZE.height / 2;
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화

    ctx.drawImage(image, 0, 0); // 이미지를 다시 그림

    let columns = document.getElementById('columns').value;
    let rows = document.getElementById('rows').value;
    let columnWidth = canvas.width / columns;
    let rowHeight = canvas.height / rows;

    ctx.strokeStyle = "red"; // 분할선 색상
    ctx.lineWidth = 2; // 분할선 두께

    for (let i = 1; i < columns; i++) {
        ctx.beginPath();
        ctx.moveTo(i * columnWidth, 0);
        ctx.lineTo(i * columnWidth, canvas.height);
        ctx.stroke();
    }

    for (let i = 1; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * rowHeight);
        ctx.lineTo(canvas.width, i * rowHeight);
        ctx.stroke();
    }
}

function splitImage() {
    let columns = document.getElementById('columns').value;
    let rows = document.getElementById('rows').value;
    let columnWidth = Math.floor(canvas.width / columns);
    let rowHeight = Math.floor(canvas.height / rows);

    let downloadContainer = document.getElementById('downloadContainer');
    downloadContainer.innerHTML = '';

    let pieceIndex = 1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            let pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = columnWidth;
            pieceCanvas.height = rowHeight;
            let pieceCtx = pieceCanvas.getContext('2d');
            pieceCtx.drawImage(
                image, // 이미지를 직접 조각으로 자름
                x * columnWidth,
                y * rowHeight,
                columnWidth,
                rowHeight,
                0,
                0,
                columnWidth,
                rowHeight
            );

            let link = document.createElement('a');
            link.download = `${imageName}_piece${pieceIndex}.png`; // 파일 이름에 따라 다운로드 이름 지정
            link.href = pieceCanvas.toDataURL();
            link.textContent = `Download Piece ${pieceIndex}`;
            downloadContainer.appendChild(link);
            downloadContainer.appendChild(document.createElement('br'));
            pieceIndex++;
        }
    }

    document.getElementById('downloadAllButton').disabled = false;

    // 분할하기 버튼 비활성화
    document.getElementById('splitButton').disabled = true;
}

async function downloadAllPieces() {
    let zip = new JSZip();
    let downloadContainer = document.getElementById('downloadContainer');
    let links = downloadContainer.getElementsByTagName('a');

    for (let i = 0; i < links.length; i++) {
        let url = links[i].href;
        let filename = links[i].download;
        let response = await fetch(url);
        let blob = await response.blob();
        zip.file(filename, blob);
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
        saveAs(content, `${imageName}_pieces.zip`); // ZIP 파일 이름 지정
    });
}