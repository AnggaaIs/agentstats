export interface ComparisonCardWeapon {
  name: string;
  category: string;
  image: string;
  cost: number | null;
  fireRate: number | null;
  magazineSize: number | null;
  headDamage: number | null;
  bodyDamage: number | null;
}

export interface ComparisonCardData {
  left: ComparisonCardWeapon;
  right: ComparisonCardWeapon;
  distance: number;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

function formatValue(
  value: number | null,
  unit = "",
  decimals = 0,
): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(decimals).replace(/\.0+$/, "")}${unit}`;
}

function drawGrid(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.035)";
  context.lineWidth = 1;

  for (let x = 0; x <= CARD_WIDTH; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CARD_HEIGHT);
    context.stroke();
  }

  for (let y = 0; y <= CARD_HEIGHT; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CARD_WIDTH, y);
    context.stroke();
  }

  context.restore();
}

function drawContainImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const renderWidth = image.naturalWidth * scale;
  const renderHeight = image.naturalHeight * scale;

  context.drawImage(
    image,
    x + (width - renderWidth) / 2,
    y + (height - renderHeight) / 2,
    renderWidth,
    renderHeight,
  );
}

async function loadImage(source: string): Promise<HTMLImageElement | null> {
  const optimizedSource = `/_next/image?url=${encodeURIComponent(source)}&w=640&q=75`;

  for (const candidate of [optimizedSource, source]) {
    const image = new Image();
    if (candidate === source) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = candidate;

    try {
      await image.decode();
      return image;
    } catch {
      // The card remains useful even when a remote artwork cannot be loaded.
    }
  }

  return null;
}

function drawWeapon(
  context: CanvasRenderingContext2D,
  weapon: ComparisonCardWeapon,
  image: HTMLImageElement | null,
  x: number,
  align: "left" | "right",
  fontFamily: string,
) {
  const panelWidth = 520;

  context.fillStyle = "rgba(21, 27, 34, 0.94)";
  context.fillRect(x, 105, panelWidth, 225);
  context.strokeStyle = "rgba(255, 255, 255, 0.12)";
  context.strokeRect(x + 0.5, 105.5, panelWidth - 1, 224);

  if (image) {
    drawContainImage(context, image, x + 34, 116, panelWidth - 68, 125);
  } else {
    context.fillStyle = "rgba(255, 255, 255, 0.045)";
    context.fillRect(x + 34, 126, panelWidth - 68, 105);
  }

  context.textAlign = align;
  const textX = align === "left" ? x + 28 : x + panelWidth - 28;

  context.fillStyle = "#ff4655";
  context.font = `800 15px ${fontFamily}`;
  context.fillText(weapon.category.toUpperCase(), textX, 267);

  context.fillStyle = "#f3f0e9";
  context.font = `900 44px ${fontFamily}`;
  context.fillText(weapon.name.toUpperCase(), textX, 309, panelWidth - 56);
}

interface CardMetric {
  label: string;
  left: number | null;
  right: number | null;
  unit?: string;
  decimals?: number;
  lowerIsBetter?: boolean;
}

function drawMetric(
  context: CanvasRenderingContext2D,
  metric: CardMetric,
  y: number,
  fontFamily: string,
) {
  const leftWins =
    metric.left !== null &&
    metric.right !== null &&
    metric.left !== metric.right &&
    (metric.lowerIsBetter
      ? metric.left < metric.right
      : metric.left > metric.right);
  const rightWins =
    metric.left !== null &&
    metric.right !== null &&
    metric.left !== metric.right &&
    (metric.lowerIsBetter
      ? metric.right < metric.left
      : metric.right > metric.left);

  context.fillStyle = "rgba(21, 27, 34, 0.94)";
  context.fillRect(40, y, 1120, 48);
  context.strokeStyle = "rgba(255, 255, 255, 0.09)";
  context.strokeRect(40.5, y + 0.5, 1119, 47);

  if (leftWins) {
    context.fillStyle = "rgba(52, 211, 153, 0.1)";
    context.fillRect(41, y + 1, 449, 46);
  }
  if (rightWins) {
    context.fillStyle = "rgba(52, 211, 153, 0.1)";
    context.fillRect(710, y + 1, 449, 46);
  }

  context.font = `900 23px ${fontFamily}`;
  context.textAlign = "left";
  context.fillStyle = leftWins ? "#6ee7b7" : "#f3f0e9";
  context.fillText(
    formatValue(metric.left, metric.unit, metric.decimals),
    64,
    y + 32,
  );

  context.textAlign = "center";
  context.fillStyle = "#9aa6b4";
  context.font = `800 13px ${fontFamily}`;
  context.fillText(metric.label.toUpperCase(), 600, y + 30);

  context.textAlign = "right";
  context.fillStyle = rightWins ? "#6ee7b7" : "#f3f0e9";
  context.font = `900 23px ${fontFamily}`;
  context.fillText(
    formatValue(metric.right, metric.unit, metric.decimals),
    1136,
    y + 32,
  );
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The comparison image could not be created."));
    }, "image/png");
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function downloadWeaponComparisonCard(
  data: ComparisonCardData,
): Promise<void> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported by this browser.");

  const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
  const [leftImage, rightImage] = await Promise.all([
    loadImage(data.left.image),
    loadImage(data.right.image),
  ]);

  context.fillStyle = "#0b1016";
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawGrid(context);

  context.fillStyle = "#ff4655";
  context.fillRect(0, 0, 12, CARD_HEIGHT);
  context.beginPath();
  context.moveTo(936, 0);
  context.lineTo(1200, 0);
  context.lineTo(1200, 154);
  context.closePath();
  context.fillStyle = "rgba(255, 70, 85, 0.09)";
  context.fill();

  context.textAlign = "left";
  context.fillStyle = "#f3f0e9";
  context.font = `900 25px ${fontFamily}`;
  context.fillText("AGENTSTATS", 40, 52);
  context.fillStyle = "#ff4655";
  context.fillRect(40, 66, 46, 4);

  context.textAlign = "right";
  context.fillStyle = "#9aa6b4";
  context.font = `800 13px ${fontFamily}`;
  context.fillText(
    `WEAPON COMPARISON  /  ${data.distance} METERS`,
    1160,
    49,
  );

  drawWeapon(context, data.left, leftImage, 40, "left", fontFamily);
  drawWeapon(context, data.right, rightImage, 640, "right", fontFamily);

  context.save();
  context.translate(600, 218);
  context.rotate(Math.PI / 4);
  context.fillStyle = "#ff4655";
  context.fillRect(-27, -27, 54, 54);
  context.restore();
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.font = `900 17px ${fontFamily}`;
  context.fillText("VS", 600, 224);

  const metrics: CardMetric[] = [
    {
      label: "Cost",
      left: data.left.cost,
      right: data.right.cost,
      unit: " cr",
      lowerIsBetter: true,
    },
    {
      label: "Fire rate",
      left: data.left.fireRate,
      right: data.right.fireRate,
      unit: "/s",
      decimals: 2,
    },
    {
      label: "Magazine",
      left: data.left.magazineSize,
      right: data.right.magazineSize,
    },
    {
      label: `Head damage at ${data.distance}m`,
      left: data.left.headDamage,
      right: data.right.headDamage,
      decimals: 1,
    },
    {
      label: `Body damage at ${data.distance}m`,
      left: data.left.bodyDamage,
      right: data.right.bodyDamage,
      decimals: 1,
    },
  ];

  metrics.forEach((metric, index) => {
    drawMetric(context, metric, 340 + index * 50, fontFamily);
  });

  context.textAlign = "left";
  context.fillStyle = "#697687";
  context.font = `700 12px ${fontFamily}`;
  context.fillText(
    "Green marks the stronger value. Lower cost wins.",
    40,
    614,
  );
  context.textAlign = "right";
  context.fillStyle = "#9aa6b4";
  context.fillText(window.location.host, 1160, 614);

  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(data.left.name)}-vs-${slugify(data.right.name)}-${data.distance}m.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
