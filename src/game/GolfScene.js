import Phaser from "phaser";
import content from "../data/content";
import { generateWind } from "./physics";

const { game: T } = content;

export const W = 800;
export const H = 480;
export const GROUND_Y = 400;
export const TEE_X = 120;
export const CUP_X = 680;
export const BALL_R = 12;

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
}
