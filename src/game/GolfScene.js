import Phaser from "phaser";
import confetti from "canvas-confetti";
import content from "../data/content";
import { generateWind, isSunk } from "./physics";

const { game: T } = content;

export const W = 800;
export const H = 480;
export const GROUND_Y = 400;
export const TEE_X = 120;
export const CUP_X = 680;
export const BALL_R = 12;

const MAX_PULL = 240; // px; drag beyond this is clamped
const POWER = 0.05; // pull-distance (px) -> launch velocity
const WIND_ACCEL = 0.14; // per-frame vx nudge at full wind strength (airborne only)
const STOP_SPEED = 0.6; // speed below which a grounded ball counts as stopped

export class GolfScene extends Phaser.Scene {
  constructor() {
    super("golf");
  }

  create() {
    this.onComplete = this.registry.get("onComplete");
    this.reduceMotion = this.registry.get("reduceMotion");

    this.attempt = 1;
    this.state = "aiming"; // aiming | flying | missed | won
    this.wind = generateWind();

    this.drawBackground();
    this.buildGround();
    this.buildHole();
    this.createBall();
    this.buildHud();

    this.aimGfx = this.add.graphics().setDepth(5);
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  drawBackground() {
    // sky gradient (two stacked rects as a cheap gradient)
    this.add.rectangle(W / 2, H / 2, W, H, 0x7ec4ff).setDepth(-10);
    this.add.rectangle(W / 2, H * 0.75, W, H * 0.5, 0xbfe6ff).setDepth(-10);
    this.add.circle(W - 120, 90, 46, 0xfff3b0).setDepth(-9); // sun

    // rolling hills
    const hills = this.add.graphics().setDepth(-8);
    hills.fillStyle(0xbfe3a8, 1);
    hills.fillEllipse(220, GROUND_Y, 640, 260);
    hills.fillStyle(0x8ccf7e, 1);
    hills.fillEllipse(620, GROUND_Y + 20, 720, 300);

    // drifting clouds (skip motion when reduced)
    [{ x: 200, y: 90, s: 1 }, { x: 520, y: 60, s: 0.7 }].forEach((c) => {
      const cloud = this.add.graphics().setDepth(-7);
      cloud.fillStyle(0xffffff, 0.95);
      cloud.fillCircle(c.x, c.y, 26 * c.s);
      cloud.fillCircle(c.x + 30 * c.s, c.y + 6 * c.s, 20 * c.s);
      cloud.fillCircle(c.x - 26 * c.s, c.y + 8 * c.s, 16 * c.s);
      if (!this.reduceMotion) {
        this.tweens.add({
          targets: cloud,
          x: 80,
          duration: 26000 / c.s,
          repeat: -1,
          yoyo: true,
        });
      }
    });
  }

  buildGround() {
    // visible fairway/green
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x2f8b3f, 1);
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    g.fillStyle(0x3fa14b, 1);
    g.fillEllipse(CUP_X, GROUND_Y + 6, 220, 40); // putting green
    // static physics floor; top surface sits at GROUND_Y
    this.matter.add.rectangle(W / 2, GROUND_Y + 60, W, 120, {
      isStatic: true,
      friction: 0.9,
      restitution: 0.2,
      label: "ground",
    });
  }

  buildHole() {
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0x0a1d10, 1);
    g.fillEllipse(CUP_X, GROUND_Y, 26, 12); // the cup

    // flag pole + flag (waves unless reduced motion)
    this.add.line(0, 0, CUP_X, GROUND_Y, CUP_X, GROUND_Y - 90, 0xefe9dc)
      .setLineWidth(2)
      .setOrigin(0, 0)
      .setDepth(-4);
    this.flag = this.add.triangle(
      CUP_X, GROUND_Y - 82, 0, 0, 34, 9, 0, 18, 0xf07522
    ).setOrigin(0, 0).setDepth(-4);
    if (!this.reduceMotion) {
      this.tweens.add({
        targets: this.flag,
        scaleX: 0.85,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  createBall() {
    if (!this.textures.exists("ball")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(BALL_R, BALL_R, BALL_R);
      g.lineStyle(2, 0xc7ced6, 1);
      g.strokeCircle(BALL_R, BALL_R, BALL_R);
      g.generateTexture("ball", BALL_R * 2, BALL_R * 2);
      g.destroy();
    }
    this.ball = this.matter.add.image(TEE_X, GROUND_Y - BALL_R, "ball");
    this.ball.setCircle(BALL_R);
    this.ball.setBounce(0.45);
    this.ball.setFriction(0.08);
    this.ball.setFrictionAir(0.02);
    this.ball.setDepth(2);
  }

  buildHud() {
    this.hintText = this.add
      .text(W / 2, H - 28, T.hint, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.windText = this.add
      .text(W / 2, 28, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#0c4374",
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.updateHud();
  }

  updateHud() {
    const arrow = this.wind.direction < 0 ? "←" : "→";
    const pct = Math.round(this.wind.strength * 100);
    this.windText.setText(`${T.windLabel} ${arrow} ${pct}%`);
  }

  onPointerDown(pointer) {
    if (this.state !== "aiming") return;
    this.dragging = true;
    this.onPointerMove(pointer);
  }

  onPointerMove(pointer) {
    if (!this.dragging || this.state !== "aiming") return;
    // Slingshot: launch vector points from the pointer back toward the ball.
    let vx = this.ball.x - pointer.x;
    let vy = this.ball.y - pointer.y;
    const len = Math.hypot(vx, vy);
    if (len > MAX_PULL) {
      vx = (vx / len) * MAX_PULL;
      vy = (vy / len) * MAX_PULL;
    }
    this.aim = { vx, vy };
    this.drawTrajectory(vx, vy);
  }

  onPointerUp() {
    if (!this.dragging || this.state !== "aiming" || !this.aim) return;
    this.dragging = false;
    this.aimGfx.clear();
    this.launch(this.aim.vx * POWER, this.aim.vy * POWER);
    this.aim = null;
  }

  drawTrajectory(vx, vy) {
    // Cheap preview: integrate a projectile (ignores wind/bounce). Hint only.
    this.aimGfx.clear();
    this.aimGfx.fillStyle(0xffffff, 0.7);
    let x = this.ball.x;
    let y = this.ball.y;
    let dx = vx * POWER;
    let dy = vy * POWER;
    for (let i = 0; i < 22; i++) {
      x += dx;
      y += dy;
      dy += 0.35; // approx gravity per step
      if (y > GROUND_Y - BALL_R) break;
      if (i % 2 === 0) this.aimGfx.fillCircle(x, y, 2.5);
    }
  }

  launch(vx, vy) {
    this.state = "flying";
    this.hintText.setVisible(false);
    this.ball.setVelocity(vx, vy);
    this.ball.setAngularVelocity(vx * 0.02);
  }

  update() {
    if (this.state !== "flying") return;
    const v = this.ball.body.velocity;
    const airborne = this.ball.y < GROUND_Y - BALL_R - 4;
    if (airborne) {
      this.ball.setVelocityX(
        v.x + this.wind.direction * this.wind.strength * WIND_ACCEL
      );
    }
    const speed = Math.hypot(v.x, v.y);
    if (!airborne && speed < STOP_SPEED) {
      this.resolveShot();
    }
    // safety: ball left the field
    if (this.ball.x < -50 || this.ball.x > W + 50) this.resolveShot();
  }

  resolveShot() {
    if (this.state !== "flying") return;
    this.state = "resolving";
    if (isSunk(this.ball.x, CUP_X, this.attempt)) {
      this.win();
    } else {
      this.miss();
    }
  }

  miss() {
    this.state = "missed";
    this.hintText.setVisible(false);
    this.showBanner(`${T.missText}\n${T.tapToRetry}`, 0x5c6b7a);
    // next tap anywhere clears the banner and re-tees
    this.input.once("pointerdown", () => {
      if (this.banner) this.banner.destroy();
      this.resetForRetry();
    });
  }

  win() {
    this.state = "won";
    this.hintText.setVisible(false);
    this.aimGfx.clear();

    // ball drops into the cup
    this.ball.setStatic(true);
    this.tweens.add({
      targets: this.ball,
      y: GROUND_Y + 6,
      scale: 0.2,
      duration: this.reduceMotion ? 1 : 260,
    });

    // hole/flag become a birthday cake
    this.drawCake();
    this.showBanner(T.sinkText, 0xe0a92e);
    if (!this.reduceMotion) this.burstConfetti();

    const wait = this.reduceMotion ? 400 : 2100;
    this.time.delayedCall(wait, () => this.onComplete && this.onComplete());
  }

  drawCake() {
    const cx = CUP_X;
    const top = GROUND_Y - 46;
    const cake = this.add.container(0, 0).setDepth(6);
    cake.add(this.add.rectangle(cx, top + 30, 70, 46, 0xf6c9a0)); // base
    cake.add(this.add.rectangle(cx, top + 8, 70, 12, 0xffffff)); // icing
    for (let i = -1; i <= 1; i++) {
      cake.add(this.add.rectangle(cx + i * 20, top - 8, 4, 18, 0xff8a3d)); // candle
      cake.add(this.add.circle(cx + i * 20, top - 20, 4, 0xffe08a)); // flame
    }
    if (this.flag) this.flag.setVisible(false);
    if (!this.reduceMotion) {
      cake.setScale(0);
      this.tweens.add({ targets: cake, scale: 1, duration: 420, ease: "Back.out" });
    }
  }

  burstConfetti() {
    confetti({
      particleCount: 200,
      spread: 110,
      startVelocity: 48,
      origin: { y: 0.7 },
      colors: ["#115E9F", "#F07522", "#FAFAFA", "#E0A92E"],
    });
  }

  showBanner(text, tint) {
    if (this.banner) this.banner.destroy();
    this.banner = this.add
      .text(W / 2, 90, text, {
        fontFamily: "Anton, sans-serif",
        fontSize: "30px",
        color: Phaser.Display.Color.IntegerToColor(tint).rgba,
        align: "center",
        backgroundColor: "#ffffffcc",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(9);
    if (!this.reduceMotion) {
      this.banner.setScale(0.8);
      this.tweens.add({
        targets: this.banner,
        scale: 1,
        duration: 300,
        ease: "Back.out",
      });
    }
  }

  resetForRetry() {
    this.attempt += 1;
    this.wind = generateWind();
    this.updateHud();
    this.ball.setVelocity(0, 0);
    this.ball.setAngularVelocity(0);
    this.ball.setPosition(TEE_X, GROUND_Y - BALL_R);
    this.ball.setRotation(0);
    this.hintText.setVisible(true);
    this.state = "aiming";
  }
}
