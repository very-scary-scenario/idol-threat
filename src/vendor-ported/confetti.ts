// originally from http://www.jqueryscript.net/animation/Confetti-Animation-jQuery-Canvas-Confetti-js.html

// modified for idol threat:
// - don't require jquery
// - export stuff
// - make particle density a publically-changeable thing
// - port to typescript
// - apply various linter recommendations

function RandomFromTo(f: number, t: number): number {
  return Math.floor(Math.random() * (t - f + 1) + f)
}


export class ConfettiParticle {
  x: number
  y: number
  r: number
  d: number
  color: string
  tilt: number
  tiltAngleIncremental: number
  tiltAngle: number
  confetti: Confetti

  constructor(color: string, confetti: Confetti) {
    this.x = Math.random() * confetti.W // x-coordinate
    this.y = (Math.random() * confetti.H) - confetti.H //y-coordinate
    this.r = RandomFromTo(10, 30) //radius;
    this.d = (Math.random() * confetti.mp) + 10 //density;
    this.color = color
    this.tilt = Math.floor(Math.random() * 10) - 10
    this.tiltAngleIncremental = (Math.random() * 0.07) + 0.05
    this.tiltAngle = 0
    this.confetti = confetti
  }

  draw(): void {
    this.confetti.ctx.beginPath()
    this.confetti.ctx.lineWidth = this.r / 2
    this.confetti.ctx.strokeStyle = this.color
    this.confetti.ctx.moveTo(this.x + this.tilt + (this.r / 4), this.y)
    this.confetti.ctx.lineTo(this.x + this.tilt, this.y + this.tilt + (this.r / 4))
    return this.confetti.ctx.stroke()
  }
}

export class Confetti {
  readonly baseMp = 30
  readonly maxMp = 100
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  mp = this.baseMp //max particles
  particles: ConfettiParticle[] = []
  angle = 0
  tiltAngle = 0
  confettiActive = true
  animationComplete = true
  reactivationTimerHandler?: ReturnType<typeof setTimeout>
  animationHandler?: ReturnType<typeof window.requestAnimationFrame>
  particleColors = {
    colorOptions: ["DodgerBlue", "OliveDrab", "Gold", "pink", "SlateBlue", "lightblue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"],
    colorIndex: 0,
    colorIncrementer: 0,
    colorThreshold: 2,
    getColor: function () {
      if (this.colorIncrementer >= this.colorThreshold) {
        this.colorIncrementer = 0
        this.colorIndex++
        if (this.colorIndex >= this.colorOptions.length) {
          this.colorIndex = 0
        }
      }
      this.colorIncrementer++
      return this.colorOptions[this.colorIndex]
    }
  }

  constructor() {
    const tempElement = document.createElement('div')
    document.body.appendChild(tempElement)
    tempElement.outerHTML = '<canvas id="confetti"></canvas>'
    this.canvas = (document.getElementById("confetti") as HTMLCanvasElement)
    this.ctx = this.canvas.getContext("2d")!
    this.W = window.innerWidth
    this.H = window.innerHeight
    this.canvas.width = this.W
    this.canvas.height = this.H

    window.addEventListener('resize', () => {
      this.W = window.innerWidth
      this.H = window.innerHeight
      this.canvas.width = this.W
      this.canvas.height = this.H
    })
  }

  setDensity(density: number) {
    // if density is 2, we want the 'default'. if it's 1, we want something super underwhelming.
    if (density === undefined) {
      this.mp = this.baseMp
    } else {
      this.mp = Math.pow((density/2), 4) * this.baseMp
    }
    this.mp = Math.min(this.mp, this.maxMp)
  }

  start() {
    this.canvas.style.display = 'block'
    this.particles = []
    this.animationComplete = false
    for (let i = 0; i < this.mp; i++) {
      const particleColor = this.particleColors.getColor()
      this.particles.push(new ConfettiParticle(particleColor, this))
    }
    this.StartConfetti()
  }

  Draw() {
    this.ctx.clearRect(0, 0, this.W, this.H)
    const results = []
    for (let i = 0; i < this.mp; i++) {
      ((j) => {
        results.push(this.particles[j].draw())
      })(i)
    }
    this.Update()

    return results
  }

  Update() {
    let remainingFlakes = 0
    let particle
    this.angle += 0.01
    this.tiltAngle += 0.1

    for (let i = 0; i < this.mp; i++) {
      particle = this.particles[i]
      if (this.animationComplete) return

      if (!this.confettiActive && particle.y < -15) {
        particle.y = this.H + 100
        continue
      }

      this.stepParticle(particle, i)

      if (particle.y <= this.H) {
        remainingFlakes++
      }
      this.CheckForReposition(particle, i)
    }

    if (remainingFlakes === 0) {
      this.StopConfetti()
    }
  }

  CheckForReposition(particle: ConfettiParticle, index: number) {
    if ((particle.x > this.W + 20 || particle.x < -20 || particle.y > this.H) && this.confettiActive) {
      if (index % 5 > 0 || index % 2 === 0) //66.67% of the flakes
      {
        this.repositionParticle(particle, Math.random() * this.W, -10, Math.floor(Math.random() * 10) - 10)
      } else {
        if (Math.sin(this.angle) > 0) {
          //Enter from the left
          this.repositionParticle(particle, -5, Math.random() * this.H, Math.floor(Math.random() * 10) - 10)
        } else {
          //Enter from the right
          this.repositionParticle(particle, this.W + 5, Math.random() * this.H, Math.floor(Math.random() * 10) - 10)
        }
      }
    }
  }

  stepParticle(particle: ConfettiParticle, particleIndex: number) {
    particle.tiltAngle += particle.tiltAngleIncremental
    particle.y += (Math.cos(this.angle + particle.d) + 3 + particle.r / 2) / 2
    particle.x += Math.sin(this.angle)
    particle.tilt = (Math.sin(particle.tiltAngle - (particleIndex / 3))) * 15
  }

  repositionParticle(particle: ConfettiParticle, xCoordinate: number, yCoordinate: number, tilt: number) {
    particle.x = xCoordinate
    particle.y = yCoordinate
    particle.tilt = tilt
  }

  StartConfetti() {
    this.W = window.innerWidth
    this.H = window.innerHeight
    this.canvas.width = this.W
    this.canvas.height = this.H
    const animloop = () => {
      if (this.animationComplete) { return null }
      this.animationHandler = window.requestAnimationFrame(animloop)
      return this.Draw()
    }
    animloop()
  }

  ClearTimers() {
    if (this.reactivationTimerHandler !== undefined) {
      clearTimeout(this.reactivationTimerHandler)
    }
    if (this.animationHandler !== undefined) {
      clearTimeout(this.animationHandler)
    }
  }

  stop() {
    this.confettiActive = false
    this.ClearTimers()
  }

  StopConfetti() {
    this.animationComplete = true
    if (this.ctx === undefined) return
    this.ctx.clearRect(0, 0, this.W, this.H)
    this.canvas.style.display = 'none'
  }

  restart() {
    this.ClearTimers()
    this.StopConfetti()
    this.reactivationTimerHandler = setTimeout(() => {
      this.confettiActive = true
      this.animationComplete = false
      this.start()
    }, 100)

  }
}

export const confetti = new Confetti()
