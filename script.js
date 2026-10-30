// Đăng ký plugin GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Khởi tạo Lenis Smooth Scroll và đồng bộ cùng GSAP Ticker
const lenis = new Lenis({
  lerp: 0.08,
  smoothWheel: true
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Bảng màu Retro Arcade Pixel cực kỳ phong phú và rực rỡ (Synthwave / Cyberpunk / 8-bit NES palette)
const RETRO_PALETTE = [
  '#FF007F', // Neon Cyber Pink
  '#00F3FF', // Neon Electric Cyan
  '#FFE600', // Arcade Gold Yellow
  '#39FF14', // Acid Green / 8-bit Slime
  '#BC13FE', // Neon Laser Purple
  '#FF5500', // Retro Blaze Orange
  '#00E5FF', // Bright Sky Blue
  '#FF0055', // Crimson Laser
  '#76FF03', // Lime Punch
  '#E040FB', // Ultraviolet
  '#FFFFFF'  // Pure Pixel Sparkle
];

// Ký tự phong cách 8-bit game, rune, glitch và pixel khối
const RETRO_CHARS = [
  '█', '▓', '▒', '░', '■', '▲', '▼', '◆', '●', '✦', '★', '✚',
  '0', '1', 'X', 'Z', '👾', '🎮', '🕹️', '#', '%', '$', '&', '@', '?'
];

// Cấu hình thông số hiệu ứng Pixel Dissolve
const config = {
  cellSize: 26,       // Kích thước ô pixel (nhỏ hơn, tạo cảm giác hạt pixel 8-bit sắc sảo)
  spreadAbove: 0.22,  // Độ lan rộng dissolve dải trên
  spreadBelow: 0.22,  // Độ lan rộng dissolve dải dưới
  scatter: 0.16       // Mức độ tán xạ hạt pixel
};

// DOM Elements
const spotlightImages = document.querySelectorAll('.spotlight-image');
const dissolveGrid = document.querySelector('.dissolve-grid');
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const hudStatus = document.getElementById('hud-status');
const progressBarFill = document.getElementById('scroll-progress-fill');

const totalImages = spotlightImages.length;
const totalTransitions = totalImages - 1;

// Đặt thứ tự lớp z-index (ảnh đầu tiên trên cùng)
spotlightImages.forEach((img, index) => {
  img.style.zIndex = totalImages - index;
});

// Tính toán ma trận ô theo kích thước màn hình
let cols = Math.ceil(window.innerWidth / config.cellSize);
let rows = Math.ceil(window.innerHeight / config.cellSize);
let fontSize = Math.max(12, Math.floor(config.cellSize * 0.7));

// Hàm băm giả lập số ngẫu nhiên cố định theo tọa độ (Deterministic Hash)
function hash(r, c, seed = 0) {
  const val = Math.sin(r * 12.9898 + c * 78.233 + seed * 43758.5453) * 43758.5453;
  return val - Math.floor(val);
}

// Lưu trữ các ô và dữ liệu tính toán
let cellDataArray = [];
let cellDOMArray = [];

function buildGrid() {
  dissolveGrid.innerHTML = '';
  cellDataArray = [];
  cellDOMArray = [];

  cols = Math.ceil(window.innerWidth / config.cellSize);
  rows = Math.ceil(window.innerHeight / config.cellSize);
  fontSize = Math.max(12, Math.floor(config.cellSize * 0.7));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'dissolve-cell block-mode';
      cell.style.width = `${config.cellSize}px`;
      cell.style.height = `${config.cellSize}px`;
      cell.style.left = `${c * config.cellSize}px`;
      cell.style.top = `${r * config.cellSize}px`;
      cell.style.fontSize = `${fontSize}px`;

      // Chọn màu retro ngẫu nhiên dựa vào hash vị trí
      const colorIndex = Math.floor(hash(r, c, 3) * RETRO_PALETTE.length);
      const cellColor = RETRO_PALETTE[colorIndex];
      cell.style.backgroundColor = cellColor;

      // Chọn ký tự retro
      const charIndex = Math.floor(hash(r, c, 4) * RETRO_CHARS.length);
      const char = RETRO_CHARS[charIndex];
      cell.textContent = char;

      // Màu chữ tương phản hoặc màu tối để hiện rõ hạt pixel
      cell.style.color = hash(r, c, 5) > 0.5 ? '#000000' : '#ffffff';

      dissolveGrid.appendChild(cell);

      // Tọa độ Y đã chuẩn hóa (0 -> 1)
      const normalizedY = (r * config.cellSize + config.cellSize / 2) / window.innerHeight;

      // Ngưỡng xuất hiện và độ lệch phân tán ngẫu nhiên
      const threshold = hash(r, c, 1);
      const scatterOffset = (hash(r, c, 2) - 0.5) * config.scatter;

      cellDataArray.push({
        normalizedY,
        threshold,
        scatterOffset,
        baseColor: cellColor,
        row: r,
        col: c
      });
      cellDOMArray.push(cell);
    }
  }
}

// Xây dựng lưới lần đầu
buildGrid();

// Xử lý khi resize màn hình
window.addEventListener('resize', () => {
  buildGrid();
  ScrollTrigger.refresh();
});

// Chiều dài di chuyển của dải dissolve
const totalRange = 1 + config.spreadAbove + config.spreadBelow;

// Cập nhật clip-path cắt ảnh từ trên xuống
function updateClipPaths(transitionIndex, localProgress) {
  spotlightImages.forEach((img, i) => {
    if (i < transitionIndex) {
      img.style.clipPath = 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)';
    } else if (i === transitionIndex) {
      const clipProgress = Math.min(Math.max((localProgress * totalRange - config.spreadAbove), 0), 1);
      const clipPercentage = clipProgress * 100;
      img.style.clipPath = `polygon(0 ${clipPercentage}%, 100% ${clipPercentage}%, 100% 100%, 0 100%)`;
    } else {
      img.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    }
  });
}

// Cập nhật các ô pixel màu sắc theo vị trí cuộn
function updateDissolveGrid(bandCenterY, localProgress) {
  cellDataArray.forEach((cellData, i) => {
    const cellDom = cellDOMArray[i];
    const rawDist = cellData.normalizedY - bandCenterY;

    // Tăng độ nhiễu & phân tán
    const distFromCenter = Math.abs(rawDist);
    const scatterFactor = Math.min(distFromCenter / config.spreadAbove, 1);
    const effectiveY = cellData.normalizedY + cellData.scatterOffset * scatterFactor;

    const dist = effectiveY - bandCenterY;

    // Nằm ngoài dải dissolve -> ẩn
    if (dist < -config.spreadAbove || dist > config.spreadBelow) {
      cellDom.style.visibility = 'hidden';
      return;
    }

    // Mật độ suy giảm từ tâm ra 2 viền
    const normDist = dist < 0 ? Math.abs(dist) / config.spreadAbove : dist / config.spreadBelow;
    const density = Math.pow(1 - normDist, 1.8);

    if (density > cellData.threshold) {
      cellDom.style.visibility = 'visible';

      // Hiệu ứng đổi màu chớp pixel khi đang cuộn
      const dynamicHue = (cellData.row * 15 + cellData.col * 10 + Math.floor(localProgress * 360)) % 360;
      if (cellData.threshold > 0.6) {
        cellDom.style.backgroundColor = `hsl(${dynamicHue}, 100%, 55%)`;
        cellDom.style.boxShadow = `0 0 8px hsl(${dynamicHue}, 100%, 50%)`;
      } else {
        cellDom.style.backgroundColor = cellData.baseColor;
        cellDom.style.boxShadow = 'none';
      }
    } else {
      cellDom.style.visibility = 'hidden';
    }
  });
}

// Ẩn toàn bộ ô khi không ở trong dải chuyển ảnh
function hideAllCells() {
  cellDOMArray.forEach(cell => {
    cell.style.visibility = 'hidden';
  });
}

// ScrollTrigger điều khiển cuộn, ghim màn hình và cập nhật HUD
ScrollTrigger.create({
  trigger: '.spotlight',
  start: 'top top',
  end: () => `+=${totalTransitions * window.innerHeight * 1.2}`,
  pin: true,
  pinSpacing: true,
  scrub: 0.6,
  onUpdate: (self) => {
    const progress = self.progress;

    // Cập nhật thanh máu / tiến trình HUD
    if (progressBarFill) {
      progressBarFill.style.width = `${Math.round(progress * 100)}%`;
    }

    // Cập nhật điểm số 8-bit và Level
    if (hudScore) {
      const score = Math.floor(progress * 85000);
      hudScore.textContent = score.toString().padStart(5, '0');
    }

    const rawIndex = progress * totalTransitions;
    let transitionIndex = Math.floor(rawIndex);
    if (transitionIndex >= totalTransitions) transitionIndex = totalTransitions - 1;

    if (hudLevel) {
      hudLevel.textContent = `0${transitionIndex + 1}`;
    }

    // Tiến trình cục bộ giữa 2 ảnh (0 -> 1)
    const localProgress = rawIndex - transitionIndex;

    // Vị trí tâm dải dissolve
    const bandCenterY = -config.spreadAbove + localProgress * totalRange;

    if (progress <= 0 || progress >= 1 || localProgress <= 0 || localProgress >= 1) {
      hideAllCells();
      updateClipPaths(transitionIndex, localProgress);
      if (hudStatus) hudStatus.textContent = progress >= 1 ? 'CLEAR' : 'STANDBY';
    } else {
      updateClipPaths(transitionIndex, localProgress);
      updateDissolveGrid(bandCenterY, localProgress);
      if (hudStatus) hudStatus.textContent = 'GLITCHING';
    }
  }
});