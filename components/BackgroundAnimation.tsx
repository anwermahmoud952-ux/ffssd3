import React, { useRef, useEffect } from 'react';

const BackgroundAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = window.innerWidth / 15;

        class Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            opacity: number;
            baseX: number;
            angle: number;
            sway: number;

            constructor(width: number, height: number) {
                this.baseX = Math.random() * width;
                this.x = this.baseX;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 1;
                this.speedY = Math.random() * 1.5 + 0.5;
                this.opacity = Math.random() * 0.4 + 0.1;
                this.angle = Math.random() * Math.PI * 2;
                this.sway = Math.random() * 10 + 5;
            }

            update(width: number, height: number) {
                this.y -= this.speedY;
                this.angle += 0.02; // Controls the sway speed
                this.x = this.baseX + Math.sin(this.angle) * this.sway;

                if (this.y < 0) {
                    this.y = height;
                    this.baseX = Math.random() * width;
                    this.x = this.baseX;
                    // Reset all properties for a new particle
                    this.size = Math.random() * 2 + 1;
                    this.speedY = Math.random() * 1.5 + 0.5;
                    this.opacity = Math.random() * 0.4 + 0.1;
                    this.angle = Math.random() * Math.PI * 2;
                    this.sway = Math.random() * 10 + 5;
                }
            }

            draw(context: CanvasRenderingContext2D) {
                context.beginPath();
                context.fillStyle = `rgba(74, 222, 128, ${this.opacity})`; // Tailwind green-400
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />;
};

export default BackgroundAnimation;
