        // Particle System
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.size = Math.random() * 3 + 2;
                this.speedX = Math.random() * 6 - 3;
                this.speedY = Math.random() * 6 - 3;
                this.life = 1.0;
                this.decay = Math.random() * 0.02 + 0.02;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.speedY += 0.1;
                this.life -= this.decay;
                return this.life > 0;
            }

            draw(ctx) {
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class ParticleSystem {
            constructor() {
                this.particles = [];
            }

            createJumpEffect(x, y) {
                const colors = [
                    '255, 255, 255',
                    '255, 223, 186',
                    '255, 190, 118'
                ];

                for (let i = 0; i < 15; i++) {
                    this.particles.push(
                        new Particle(
                            x + Math.random() * 40,
                            y + Math.random() * 10,
                            colors[Math.floor(Math.random() * colors.length)]
                        )
                    );
                }
            }

            createCoinEffect(x, y) {
                const colors = [
                    '255, 215, 0',
                    '255, 223, 0',
                    '255, 200, 0'
                ];

                for (let i = 0; i < 10; i++) {
                    this.particles.push(
                        new Particle(
                            x + Math.random() * 20,
                            y + Math.random() * 20,
                            colors[Math.floor(Math.random() * colors.length)]
                        )
                    );
                }
            }

            update() {
                this.particles = this.particles.filter(particle => particle.update());
            }

            draw(ctx) {
                this.particles.forEach(particle => particle.draw(ctx));
            }
        }

        // Coin class
        class Coin {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.width = 20;
                this.height = 20;
                this.collected = false;
                this.rotation = 0;
            }

            update() {
                this.rotation += 0.05;
            }

            draw(ctx) {
                if (this.collected) return;
                
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.rotation);
                
                // Draw coin
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw highlight
                ctx.fillStyle = '#FFF8E1';
                ctx.beginPath();
                ctx.ellipse(-3, -3, 3, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        // Power-up class
        class PowerUp {
            constructor(x, y, type) {
                this.x = x;
                this.y = y;
                this.width = 30;
                this.height = 30;
                this.type = type;
                this.collected = false;
            }

            draw(ctx) {
                if (this.collected) return;
                
                if (this.type === 'magnet') {
                    // Рисуем магнит
                    ctx.fillStyle = '#FF5722';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px Arial';
                    ctx.fillText('🧲', this.x + 5, this.y + 22);
                } else {
                    ctx.fillStyle = this.type === 'spring' ? '#FF4081' : '#FFC107';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px Arial';
                    ctx.fillText(this.type === 'spring' ? '↑' : '★', this.x + 8, this.y + 22);
                }
            }
        }

        // Player class
        class Player {
            constructor(x, y, skin) {
                this.x = x;
                this.y = y;
                this.width = 40;
                this.height = 40;
                this.velocityX = 0;
                this.velocityY = 0;
                this.isJumping = false;
                this.powerUpTimer = 0;
                this.hasPowerUp = false;
                this.powerUpType = null;
                this.skin = skin;
                this.blinkTimer = 0;
                this.eyesClosed = false;
                this.animationFrame = 0;
                this.magnetActive = false;
                this.magnetTimer = 0;
                
                // Initialize skin-specific abilities
                this.extraJumpAvailable = false;
                this.fallProtection = false;
                this.doubleCoinsChance = 0;
                this.fireTrail = false;
                this.fireParticles = [];
                
                // Apply skin effects
                this.setSkin(skin);
            }

            update(canvasWidth) {
                this.velocityY += 0.5;
                this.x += this.velocityX;
                this.y += this.velocityY;

                if (this.x + this.width < 0) {
                    this.x = canvasWidth;
                } else if (this.x > canvasWidth) {
                    this.x = -this.width;
                }

                if (this.powerUpTimer > 0) {
                    this.powerUpTimer--;
                    if (this.powerUpTimer === 0) {
                        this.hasPowerUp = false;
                        this.powerUpType = null;
                    }
                }
                
                // Обновление таймера магнита
                if (this.magnetTimer > 0) {
                    this.magnetTimer--;
                    if (this.magnetTimer === 0) {
                        this.magnetActive = false;
                    }
                }
                
                // Анимация моргания
                this.blinkTimer++;
                if (this.blinkTimer > 120) { // Моргает каждые ~2 секунды
                    this.eyesClosed = true;
                    if (this.blinkTimer > 130) { // Глаза закрыты на ~0.16 секунды
                        this.eyesClosed = false;
                        this.blinkTimer = 0;
                    }
                }
                
                // Анимация движения
                this.animationFrame = (this.animationFrame + 1) % 60;
                
                // Обновление огненного следа
                if (this.fireTrail) {
                    // Создаем частицы огня при движении (не только при прыжке)
                    if (Math.random() < 0.3 || Math.abs(this.velocityX) > 0) {
                        this.fireParticles.push({
                            x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                            y: this.y + this.height,
                            size: Math.random() * 5 + 3,
                            speedX: (Math.random() - 0.5) * 2,
                            speedY: Math.random() * 2 + 1,
                            life: 1.0,
                            color: `rgba(${Math.floor(Math.random() * 55 + 200)}, ${Math.floor(Math.random() * 100)}, 0, 1)`
                        });
                    }
                }
                
                // Обновление всех частиц (огненный след и эффекты смены скина)
                for (let i = this.fireParticles.length - 1; i >= 0; i--) {
                    const particle = this.fireParticles[i];
                    
                    // Если у частицы есть speedX (частицы смены скина), используем его
                    if (particle.speedX !== undefined) {
                        particle.x += particle.speedX;
                        particle.y += particle.speedY;
                    } else {
                        // Иначе это частица огненного следа
                        particle.y += particle.speedY;
                        if (particle.speedX) {
                            particle.x += particle.speedX;
                        }
                    }
                    
                    particle.life -= 0.02;
                    
                    if (particle.life <= 0) {
                        this.fireParticles.splice(i, 1);
                    }
                }
            }

            draw(ctx) {
                // Рисуем все частицы (огненный след и эффекты смены скина)
                for (const particle of this.fireParticles) {
                    if (particle.color) {
                        // Частицы смены скина или специальные частицы
                        ctx.fillStyle = typeof particle.color === 'string' 
                            ? `rgba(${particle.color.slice(4, -1)}, ${particle.life})` 
                            : particle.color;
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Огненный след
                        const gradient = ctx.createRadialGradient(
                            particle.x, particle.y, 0,
                            particle.x, particle.y, particle.size
                        );
                        gradient.addColorStop(0, `rgba(255, 255, 0, ${particle.life})`);
                        gradient.addColorStop(0.5, `rgba(255, 165, 0, ${particle.life})`);
                        gradient.addColorStop(1, `rgba(255, 0, 0, ${particle.life * 0.5})`);
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // Рисуем магнитное поле, если активно
                if (this.magnetActive) {
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 100, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 87, 34, ${0.3 + Math.sin(this.animationFrame * 0.1) * 0.2})`;
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                
                // Рисуем индикатор защиты от падения, если активен
                if (this.fallProtection && this.skin === 'hat') {
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.7, 
                             0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(139, 69, 19, ${0.5 + Math.sin(this.animationFrame * 0.1) * 0.3})`;
                    ctx.setLineDash([3, 3]);
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Add a hat icon above the player
                    ctx.font = '16px Arial';
                    ctx.fillText('🎩', this.x + this.width / 2 - 8, this.y - 10);
                }
                
                // Рисуем индикатор высокого прыжка, если доступен
                if (this.extraJumpAvailable && this.skin === 'glasses') {
                    // Keep only the triangle indicator above the player
                    ctx.beginPath();
                    const arrowY = this.y - 15;
                    ctx.moveTo(this.x + this.width / 2, arrowY - 10);
                    ctx.lineTo(this.x + this.width / 2 - 7, arrowY);
                    ctx.lineTo(this.x + this.width / 2 + 7, arrowY);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 + Math.sin(this.animationFrame * 0.2) * 0.5})`;
                    ctx.fill();
                    
                    // Remove glasses icon
                    // Remove pulsing circle effect
                }
                
                // Рисуем индикатор двойных монет, если активен
                if (this.doubleCoinsChance > 0 && this.skin === 'gold' && Math.random() < 0.05) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                    ctx.font = '12px Arial';
                    ctx.fillText('x2', this.x + this.width + 5, this.y + 10);
                }
                
                // Выбираем скин для отрисовки
                switch(this.skin) {
                    case 'hat':
                        this.drawPlayerWithHat(ctx);
                        break;
                    case 'glasses':
                        this.drawPlayerWithGlasses(ctx);
                        break;
                    case 'clothes':
                        this.drawPlayerWithClothes(ctx);
                        break;
                    case 'gold':
                        this.drawGoldPlayer(ctx);
                        break;
                    case 'fire':
                        this.drawFirePlayer(ctx);
                        break;
                    default:
                        this.drawDefaultPlayer(ctx);
                        break;
                }
            }
            
            // Золотой куб
            drawGoldPlayer(ctx) {
                // Тело персонажа
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, '#FFC107');
                gradient.addColorStop(1, '#FF8F00');
                
                ctx.fillStyle = this.hasPowerUp ? '#FFD700' : gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Блики на золоте
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 5);
                ctx.lineTo(this.x + 15, this.y + 5);
                ctx.lineTo(this.x + 5, this.y + 15);
                ctx.closePath();
                ctx.fill();
                
                // Глаза
                if (!this.eyesClosed) {
                    // Открытые глаза
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(this.x + 12, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.arc(this.x + 28, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачки
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(this.x + 12 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.arc(this.x + 28 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Закрытые глаза (моргание)
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x + 9, this.y + 15);
                    ctx.lineTo(this.x + 15, this.y + 15);
                    ctx.moveTo(this.x + 25, this.y + 15);
                    ctx.lineTo(this.x + 31, this.y + 15);
                    ctx.stroke();
                }
                
                // Рот
                ctx.beginPath();
                const smileOffset = Math.sin(this.animationFrame * 0.1) * 2;
                ctx.arc(this.x + 20, this.y + 25 + smileOffset, 6, 0, Math.PI);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Эффект сверкания
                if (Math.random() < 0.05) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    const sparkX = this.x + Math.random() * this.width;
                    const sparkY = this.y + Math.random() * this.height;
                    ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Огненный куб
            drawFirePlayer(ctx) {
                // Тело персонажа
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#FF5722');
                gradient.addColorStop(0.5, '#E64A19');
                gradient.addColorStop(1, '#BF360C');
                
                ctx.fillStyle = this.hasPowerUp ? '#FFD700' : gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Эффект пламени на верхней части
                const flameHeight = 10 + Math.sin(this.animationFrame * 0.2) * 5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.width / 4, this.y - flameHeight / 2);
                ctx.lineTo(this.x + this.width / 2, this.y - flameHeight);
                ctx.lineTo(this.x + this.width * 3/4, this.y - flameHeight / 2);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.closePath();
                
                const flameGradient = ctx.createLinearGradient(this.x, this.y - flameHeight, this.x, this.y);
                flameGradient.addColorStop(0, 'rgba(255, 255, 0, 0.7)');
                flameGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.7)');
                flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0.7)');
                ctx.fillStyle = flameGradient;
                ctx.fill();
                
                // Глаза
                if (!this.eyesClosed) {
                    // Открытые глаза
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(this.x + 12, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.arc(this.x + 28, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачки
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(this.x + 12 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.arc(this.x + 28 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Закрытые глаза (моргание)
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x + 9, this.y + 15);
                    ctx.lineTo(this.x + 15, this.y + 15);
                    ctx.moveTo(this.x + 25, this.y + 15);
                    ctx.lineTo(this.x + 31, this.y + 15);
                    ctx.stroke();
                }
                
                // Рот
                ctx.beginPath();
                const smileOffset = Math.sin(this.animationFrame * 0.1) * 2;
                ctx.arc(this.x + 20, this.y + 25 + smileOffset, 6, 0, Math.PI);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Базовый персонаж
            drawDefaultPlayer(ctx) {
                // Тело персонажа
                ctx.fillStyle = this.hasPowerUp ? '#FFD700' : '#4CAF50';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Тень
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(this.x + this.width - 10, this.y, 10, this.height);
                
                // Глаза
                if (!this.eyesClosed) {
                    // Открытые глаза
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(this.x + 12, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.arc(this.x + 28, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачки
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(this.x + 12 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.arc(this.x + 28 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Закрытые глаза (моргание)
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x + 9, this.y + 15);
                    ctx.lineTo(this.x + 15, this.y + 15);
                    ctx.moveTo(this.x + 25, this.y + 15);
                    ctx.lineTo(this.x + 31, this.y + 15);
                    ctx.stroke();
                }
                
                // Рот
                ctx.beginPath();
                const smileOffset = Math.sin(this.animationFrame * 0.1) * 2;
                ctx.arc(this.x + 20, this.y + 25 + smileOffset, 6, 0, Math.PI);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Персонаж с шляпой
            drawPlayerWithHat(ctx) {
                // Рисуем базового персонажа
                this.drawDefaultPlayer(ctx);
                
                // Рисуем шляпу
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, 10);
                
                // Верхняя часть шляпы
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(this.x + 5, this.y - 20, this.width - 10, 15);
                
                // Лента на шляпе
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(this.x + 5, this.y - 8, this.width - 10, 3);
            }
            
            // Персонаж с очками
            drawPlayerWithGlasses(ctx) {
                // Рисуем базового персонажа
                this.drawDefaultPlayer(ctx);
                
                // Рисуем очки
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                
                // Левая линза
                ctx.beginPath();
                ctx.arc(this.x + 12, this.y + 15, 7, 0, Math.PI * 2);
                ctx.stroke();
                
                // Правая линза
                ctx.beginPath();
                ctx.arc(this.x + 28, this.y + 15, 7, 0, Math.PI * 2);
                ctx.stroke();
                
                // Перемычка очков
                ctx.beginPath();
                ctx.moveTo(this.x + 19, this.y + 15);
                ctx.lineTo(this.x + 21, this.y + 15);
                ctx.stroke();
                
                // Дужки очков
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 15);
                ctx.lineTo(this.x, this.y + 12);
                ctx.moveTo(this.x + 35, this.y + 15);
                ctx.lineTo(this.x + 40, this.y + 12);
                ctx.stroke();
            }
            
            // Персонаж с одеждой
            drawPlayerWithClothes(ctx) {
                // Тело персонажа (с другим цветом)
                ctx.fillStyle = this.hasPowerUp ? '#FFD700' : '#4CAF50';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Тень
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(this.x + this.width - 10, this.y, 10, this.height);
                
                // Глаза
                if (!this.eyesClosed) {
                    // Открытые глаза
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(this.x + 12, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.arc(this.x + 28, this.y + 15, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачки
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(this.x + 12 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.arc(this.x + 28 + Math.sin(this.animationFrame * 0.1) * 2, 
                             this.y + 15 + Math.cos(this.animationFrame * 0.1), 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Закрытые глаза (моргание)
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x + 9, this.y + 15);
                    ctx.lineTo(this.x + 15, this.y + 15);
                    ctx.moveTo(this.x + 25, this.y + 15);
                    ctx.lineTo(this.x + 31, this.y + 15);
                    ctx.stroke();
                }
                
                // Рот
                ctx.beginPath();
                const smileOffset = Math.sin(this.animationFrame * 0.1) * 2;
                ctx.arc(this.x + 20, this.y + 25 + smileOffset, 6, 0, Math.PI);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Рисуем одежду (футболку)
                ctx.fillStyle = '#3F51B5';
                ctx.fillRect(this.x, this.y + this.height/2, this.width, this.height/2);
                
                // Воротник
                ctx.fillStyle = '#C5CAE9';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
                ctx.lineTo(this.x + this.width/2 - 10, this.y + this.height/2 + 10);
                ctx.lineTo(this.x + this.width/2 + 10, this.y + this.height/2 + 10);
                ctx.closePath();
                ctx.fill();
                
                // Полоска на футболке
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x, this.y + this.height - 10, this.width, 5);
            }

            jump(force = -12) {
                this.velocityY = force;
                this.isJumping = true;
            }

            activatePowerUp(type) {
                this.hasPowerUp = true;
                this.powerUpType = type;
                this.powerUpTimer = 300;
                
                if (type === 'spring') {
                    this.jump(-18);
                } else if (type === 'magnet') {
                    this.magnetActive = true;
                    this.magnetTimer = 600; // 10 секунд (60 кадров в секунду)
                }
            }
            
            setSkin(skin) {
                // Store previous skin for effect comparison
                const previousSkin = this.skin;
                
                // Update skin
                this.skin = skin;
                localStorage.setItem('doodleJumpSkin', skin);
                
                // Reset all skin effects first
                this.extraJumpAvailable = false;
                this.fallProtection = false;
                this.doubleCoinsChance = 0;
                this.fireTrail = false;
                this.fireParticles = [];
                
                // Activate effects based on the selected skin
                switch(skin) {
                    case 'glasses':
                        this.extraJumpAvailable = true;
                        break;
                    case 'hat':
                        this.fallProtection = true;
                        break;
                    case 'gold':
                        this.doubleCoinsChance = 0.3; // 30% шанс двойных монет
                        break;
                    case 'fire':
                        this.fireTrail = true;
                        break;
                }
                
                // Create visual effect when changing skins (if not initial load)
                if (previousSkin && previousSkin !== skin) {
                    // Create particles around the player for visual feedback
                    for (let i = 0; i < 20; i++) {
                        this.fireParticles.push({
                            x: this.x + Math.random() * this.width,
                            y: this.y + Math.random() * this.height,
                            size: Math.random() * 5 + 2,
                            speedX: (Math.random() - 0.5) * 4,
                            speedY: (Math.random() - 0.5) * 4,
                            life: 1.0,
                            color: this.getSkinColor(skin)
                        });
                    }
                }
            }
            
            // Helper method to get color based on skin type
            getSkinColor(skin) {
                switch(skin) {
                    case 'default': return '#4CAF50';
                    case 'hat': return '#8B4513';
                    case 'glasses': return '#000000';
                    case 'clothes': return '#3F51B5';
                    case 'gold': return '#FFD700';
                    case 'fire': return '#FF5722';
                    default: return '#FFFFFF';
                }
            }

            // New method for manual double jump activation
            activateDoubleJump() {
                if (this.extraJumpAvailable && this.skin === 'glasses') {
                    this.velocityY = -24; // Double the normal jump force
                    this.extraJumpAvailable = false;
                    
                    // Create a trail effect for the super jump
                    for (let i = 0; i < 30; i++) {
                        this.fireParticles.push({
                            x: this.x + Math.random() * this.width,
                            y: this.y + this.height - Math.random() * 10,
                            size: Math.random() * 5 + 3,
                            speedX: (Math.random() - 0.5) * 3,
                            speedY: Math.random() * 5 + 5, // Particles move downward
                            life: 1.0,
                            color: '#000000'
                        });
                    }
                    
                    return true;
                }
                return false;
            }
        }

        // Platform class
        class Platform {
            constructor(x, y, type = 'normal') {
                this.x = x;
                this.y = y;
                this.width = 80;
                this.height = 15;
                this.type = type;
                this.broken = false;
                this.direction = 1;
                this.speed = type === 'moving' ? 2 : 0;
                this.hasDoubleCoins = false;
                
                // Add power-up with 10% chance
                if (Math.random() < 0.1) {
                    const powerUpType = this.getRandomPowerUpType();
                    this.powerUp = new PowerUp(
                        this.x + this.width / 2 - 15,
                        this.y - 35,
                        powerUpType
                    );
                }
                
                // Add coin with 25% chance (but not if there's already a power-up)
                if (!this.powerUp && Math.random() < 0.25) {
                    // Determine if we should spawn double coins (30% chance)
                    this.hasDoubleCoins = Math.random() < 0.3;
                    
                    if (this.hasDoubleCoins) {
                        // Create main coin
                        this.coin = new Coin(
                            this.x + this.width / 2 - 20,
                            this.y - 30
                        );
                        
                        // Create second coin
                        this.secondCoin = new Coin(
                            this.x + this.width / 2 + 5,
                            this.y - 30
                        );
                    } else {
                        // Just one coin
                        this.coin = new Coin(
                            this.x + this.width / 2 - 10,
                            this.y - 30
                        );
                    }
                }
            }
            
            getRandomPowerUpType() {
                const types = ['spring', 'star', 'magnet'];
                const weights = [0.5, 0.3, 0.2]; // 50% пружина, 30% звезда, 20% магнит
                
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = 0; i < types.length; i++) {
                    if (random < weights[i]) {
                        return types[i];
                    }
                    random -= weights[i];
                }
                
                return 'spring'; // По умолчанию пружина
            }

            update(canvasWidth) {
                if (this.type === 'moving') {
                    this.x += this.speed * this.direction;
                    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
                        this.direction *= -1;
                    }
                    
                    if (this.powerUp && !this.powerUp.collected) {
                        this.powerUp.x = this.x + this.width / 2 - 15;
                    }
                    
                    if (this.coin && !this.coin.collected) {
                        this.coin.x = this.x + this.width / 2 - 10;
                        this.coin.update();
                    }
                    
                    // Обновляем позицию второй монеты, если она есть
                    if (this.secondCoin && !this.secondCoin.collected) {
                        this.secondCoin.x = this.x + this.width / 2 + 5;
                        this.secondCoin.update();
                    }
                } else {
                    if (this.coin && !this.coin.collected) {
                        this.coin.update();
                    }
                    
                    // Обновляем вторую монету, если она есть
                    if (this.secondCoin && !this.secondCoin.collected) {
                        this.secondCoin.update();
                    }
                }
            }

            draw(ctx) {
                if (this.broken) return;
                
                switch(this.type) {
                    case 'normal':
                        ctx.fillStyle = '#795548';
                        break;
                    case 'moving':
                        ctx.fillStyle = '#2196F3';
                        break;
                    case 'breakable':
                        ctx.fillStyle = '#FF5722';
                        break;
                }
                ctx.fillRect(this.x, this.y, this.width, this.height);

                if (this.powerUp && !this.powerUp.collected) {
                    this.powerUp.draw(ctx);
                }
                
                if (this.coin && !this.coin.collected) {
                    this.coin.draw(ctx);
                }
                
                // Отрисовываем вторую монету, если она есть
                if (this.secondCoin && !this.secondCoin.collected) {
                    this.secondCoin.draw(ctx);
                }
            }
        }

        // Game class
        class Game {
            constructor(canvas, ctx) {
                console.log("Конструктор Game вызван");
                this.canvas = canvas;
                this.ctx = ctx;
                this.score = 0;
                this.highScore = parseInt(localStorage.getItem('doodleJumpHighScore')) || 0;
                this.coins = parseInt(localStorage.getItem('doodleJumpCoins')) || 0;
                this.gameOver = false;
                this.platforms = [];
                this.particles = new ParticleSystem();
                this.difficulty = 1;
                this.cameraY = 0;
                this.instructionsHidden = false;
                this.shopUnlocked = true; // Always unlocked for testing
                this.ownedSkins = JSON.parse(localStorage.getItem('doodleJumpOwnedSkins')) || ['default'];
                this.notificationTimeout = null; // For tracking notification timeouts
                this.shopItems = [
                    {
                        id: 'default',
                        name: 'Обычный',
                        description: 'Базовый персонаж без особых способностей',
                        price: 0,
                        owned: true,
                        image: 'assets/player.png',
                        emoji: '🟩'
                    },
                    {
                        id: 'hat',
                        name: 'Шляпа',
                        description: 'Защищает от одного падения. Активируется автоматически при падении.',
                        price: 1000,
                        owned: false,
                        image: 'assets/player_hat.png',
                        emoji: '🎩'
                    },
                    {
                        id: 'glasses',
                        name: 'Очки',
                        description: 'Позволяет прыгнуть выше. Активируется двойным нажатием на экран.',
                        price: 1000,
                        owned: false,
                        image: 'assets/player_glasses.png',
                        emoji: '👓'
                    },
                    {
                        id: 'clothes',
                        name: 'Одежда',
                        description: 'Стильная одежда для вашего персонажа. Чисто косметический эффект.',
                        price: 200,
                        owned: false,
                        image: 'assets/player_clothes.png',
                        emoji: '👕'
                    },
                    {
                        id: 'gold',
                        name: 'Золотой куб',
                        description: 'Увеличивает шанс получения двойных монет на 30%. Эффект постоянный.',
                        price: 750,
                        owned: false,
                        image: 'assets/player_gold.png',
                        emoji: '🟨',
                        premium: true,
                        starPrice: 5
                    },
                    {
                        id: 'fire',
                        name: 'Огненный куб',
                        description: 'Оставляет огненный след при прыжке. Активен постоянно во время игры.',
                        price: 500,
                        owned: false,
                        image: 'assets/player_fire.png',
                        emoji: '🔥',
                        premium: true,
                        starPrice: 10
                    }
                ];
                this.telegramStarsAvailable = false; // Флаг доступности Telegram Stars
                this.telegramStarsPrices = {
                    'gold': 30,
                    'fire': 50
                };
                this.skins = [
                    { id: 'default', name: 'Default', price: 0, premium: false },
                    { id: 'hat', name: 'Hat', price: 250, premium: false },
                    { id: 'glasses', name: 'Glasses', price: 250, premium: false },
                    { id: 'clothes', name: 'Clothes', price: 50, premium: false },
                    { id: 'goldCube', name: 'Gold Cube', price: 187, premium: false },
                    { id: 'fireCube', name: 'Fire Cube', price: 125, premium: false }
                ];
            }

            init() {
                console.log("Game.init() вызван");
                // Set up canvas
                const canvas = document.getElementById('gameCanvas');
                if (canvas) {
                    this.canvas = canvas;
                    this.ctx = canvas.getContext('2d');
                } else {
                    console.error('Canvas element not found!');
                    return;
                }
                
                // Resize canvas to fit window
                this.resizeCanvas();
                window.addEventListener('resize', () => this.resizeCanvas());
                
                // Load high score from local storage
                this.highScore = parseInt(localStorage.getItem('doodleJumpHighScore')) || 0;
                
                // Load coins from local storage
                this.coins = parseInt(localStorage.getItem('doodleJumpCoins')) || 0;
                
                // Initialize owned skins
                this.ownedSkins = JSON.parse(localStorage.getItem('doodleJumpOwnedSkins')) || ['default'];
                
                // Check if device is mobile
                this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Show start screen
                const startScreen = document.getElementById('startScreen');
                if (startScreen) {
                    startScreen.style.display = 'flex';
                }
                
                // Hide game UI
                const gameUI = document.getElementById('gameUI');
                if (gameUI) {
                    gameUI.style.display = 'none';
                }
            }

            generatePlatform(y) {
                const types = ['normal', 'moving', 'breakable'];
                const type = Math.random() < 0.7 ? 'normal' : types[Math.floor(Math.random() * types.length)];
                const x = Math.random() * (this.canvas.width - 80);
                this.platforms.push(new Platform(x, y, type));
            }

            update() {
                if (this.gameOver) return;

                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;

                this.player.update(canvasWidth);
                this.particles.update();

                // Update difficulty
                this.difficulty = 1 + Math.floor(this.score / 1000);

                // Camera follow
                if (this.player.y < canvasHeight / 2) {
                    const diff = canvasHeight / 2 - this.player.y;
                    this.cameraY += diff;
                    this.player.y += diff;
                    
                    this.platforms.forEach(platform => {
                        platform.y += diff;
                        if (platform.powerUp) {
                            platform.powerUp.y += diff;
                        }
                        if (platform.coin) {
                            platform.coin.y += diff;
                        }
                        if (platform.secondCoin) {
                            platform.secondCoin.y += diff;
                        }
                    });

                    // Remove platforms that are off screen
                    this.platforms = this.platforms.filter(platform => platform.y < canvasHeight);

                    // Generate new platforms
                    while (this.platforms.length < 7) {
                        this.generatePlatform(this.platforms[this.platforms.length - 1].y - 100);
                    }

                    this.score = Math.floor(this.cameraY / 100);
                }
                
                // Проверка на магнит и притягивание монет
                if (this.player.magnetActive) {
                    const magnetRadius = 100; // Радиус действия магнита
                    const playerCenterX = this.player.x + this.player.width / 2;
                    const playerCenterY = this.player.y + this.player.height / 2;
                    
                    this.platforms.forEach(platform => {
                        // Притягивание первой монеты
                        if (platform.coin && !platform.coin.collected) {
                            const coinCenterX = platform.coin.x + platform.coin.width / 2;
                            const coinCenterY = platform.coin.y + platform.coin.height / 2;
                            
                            // Расчет расстояния между игроком и монетой
                            const dx = playerCenterX - coinCenterX;
                            const dy = playerCenterY - coinCenterY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            // Если монета в радиусе действия магнита
                            if (distance < magnetRadius) {
                                // Притягиваем монету к игроку
                                const speed = 5;
                                const angle = Math.atan2(dy, dx);
                                platform.coin.x += Math.cos(angle) * speed;
                                platform.coin.y += Math.sin(angle) * speed;
                                
                                // Проверяем, достигла ли монета игрока
                                if (distance < 20) {
                                    platform.coin.collected = true;
                                    
                                    // Проверка на двойные монеты для золотого скина
                                    let coinsToAdd = 1;
                                    if (this.player.doubleCoinsChance > 0 && Math.random() < this.player.doubleCoinsChance) {
                                        coinsToAdd = 2;
                                        // Эффект для двойных монет
                                        this.particles.createCoinEffect(platform.coin.x + 5, platform.coin.y - 5);
                                    }
                                    
                                    this.coins += coinsToAdd;
                                    localStorage.setItem('doodleJumpCoins', this.coins);
                                    this.updateCoinCounter();
                                    this.particles.createCoinEffect(platform.coin.x, platform.coin.y);
                                }
                            }
                        }
                        
                        // Притягивание второй монеты, если она есть
                        if (platform.secondCoin && !platform.secondCoin.collected) {
                            const coinCenterX = platform.secondCoin.x + platform.secondCoin.width / 2;
                            const coinCenterY = platform.secondCoin.y + platform.secondCoin.height / 2;
                            
                            // Расчет расстояния между игроком и монетой
                            const dx = playerCenterX - coinCenterX;
                            const dy = playerCenterY - coinCenterY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            // Если монета в радиусе действия магнита
                            if (distance < magnetRadius) {
                                // Притягиваем монету к игроку
                                const speed = 5;
                                const angle = Math.atan2(dy, dx);
                                platform.secondCoin.x += Math.cos(angle) * speed;
                                platform.secondCoin.y += Math.sin(angle) * speed;
                                
                                // Проверяем, достигла ли монета игрока
                                if (distance < 20) {
                                    platform.secondCoin.collected = true;
                                    this.coins += 1;
                                    localStorage.setItem('doodleJumpCoins', this.coins);
                                    this.updateCoinCounter();
                                    this.particles.createCoinEffect(platform.secondCoin.x, platform.secondCoin.y);
                                }
                            }
                        }
                    });
                }

                // Update platforms and check collisions
                this.platforms.forEach(platform => {
                    platform.update(canvasWidth);
                    
                    // Power-up collision
                    if (platform.powerUp && !platform.powerUp.collected &&
                        this.player.x + this.player.width > platform.powerUp.x &&
                        this.player.x < platform.powerUp.x + platform.powerUp.width &&
                        this.player.y + this.player.height > platform.powerUp.y &&
                        this.player.y < platform.powerUp.y + platform.powerUp.height) {
                        platform.powerUp.collected = true;
                        this.player.activatePowerUp(platform.powerUp.type);
                    }
                    
                    // Coin collision
                    if (platform.coin && !platform.coin.collected &&
                        this.player.x + this.player.width > platform.coin.x &&
                        this.player.x < platform.coin.x + platform.coin.width &&
                        this.player.y + this.player.height > platform.coin.y &&
                        this.player.y < platform.coin.y + platform.coin.height) {
                        platform.coin.collected = true;
                        
                        // Проверка на двойные монеты для золотого скина
                        let coinsToAdd = 1;
                        if (this.player.doubleCoinsChance > 0 && Math.random() < this.player.doubleCoinsChance) {
                            coinsToAdd = 2;
                            // Эффект для двойных монет
                            this.particles.createCoinEffect(platform.coin.x + 5, platform.coin.y - 5);
                        }
                        
                        this.coins += coinsToAdd;
                        localStorage.setItem('doodleJumpCoins', this.coins);
                        this.updateCoinCounter();
                        this.particles.createCoinEffect(platform.coin.x, platform.coin.y);
                        
                        // Check if shop should be unlocked
                        if (this.coins >= 50 && !this.shopUnlocked) {
                            this.shopUnlocked = true;
                        }
                    }
                    
                    // Second coin collision
                    if (platform.secondCoin && !platform.secondCoin.collected &&
                        this.player.x + this.player.width > platform.secondCoin.x &&
                        this.player.x < platform.secondCoin.x + platform.secondCoin.width &&
                        this.player.y + this.player.height > platform.secondCoin.y &&
                        this.player.y < platform.secondCoin.y + platform.secondCoin.height) {
                        platform.secondCoin.collected = true;
                        
                        this.coins += 1;
                        localStorage.setItem('doodleJumpCoins', this.coins);
                        this.updateCoinCounter();
                        this.particles.createCoinEffect(platform.secondCoin.x, platform.secondCoin.y);
                        
                        // Check if shop should be unlocked
                        if (this.coins >= 50 && !this.shopUnlocked) {
                            this.shopUnlocked = true;
                        }
                    }
                    
                    // Platform collision
                    if (!platform.broken && this.player.velocityY > 0 && 
                        this.player.x + this.player.width > platform.x &&
                        this.player.x < platform.x + platform.width &&
                        this.player.y + this.player.height > platform.y &&
                        this.player.y + this.player.height < platform.y + platform.height + 10) {
                        
                        if (platform.type === 'breakable') {
                            platform.broken = true;
                        }
                        this.player.jump();
                        this.particles.createJumpEffect(this.player.x, this.player.y + this.player.height);
                    }
                });

                // Check game over
                if (this.player.y > canvasHeight) {
                    // Проверка на защиту от падения (шляпа)
                    if (this.player.fallProtection && this.player.skin === 'hat') {
                        this.player.fallProtection = false; // Используем защиту
                        
                        // Находим последнюю платформу для телепортации
                        let highestPlatform = null;
                        let highestY = canvasHeight;
                        
                        for (const platform of this.platforms) {
                            if (platform.y < highestY) {
                                highestY = platform.y;
                                highestPlatform = platform;
                            }
                        }
                        
                        if (highestPlatform) {
                            // Телепортируем игрока на самую высокую платформу
                            this.player.x = highestPlatform.x + highestPlatform.width / 2 - this.player.width / 2;
                            this.player.y = highestPlatform.y - this.player.height;
                        } else {
                            // Если платформ нет, просто возвращаем наверх
                            this.player.y = canvasHeight - 100;
                        }
                        
                        this.player.velocityY = -15; // Даем небольшой прыжок
                        
                        // Создаем эффект телепортации
                        this.showTeleportEffect();
                        
                        // Создаем уведомление о спасении
                        this.showNotification('🎩 Шляпа спасла вас от падения!');
                        
                        // Эффект использования защиты - больше частиц
                        for (let i = 0; i < 3; i++) {
                            this.particles.createJumpEffect(
                                this.player.x + Math.random() * this.player.width, 
                                this.player.y + this.player.height
                            );
                        }
                    } else {
                        this.endGame();
                    }
                }
                
                // Проверка на использование высокого прыжка
                if (this.player.extraJumpAvailable === false && this.player.skin === 'glasses' && 
                    this.player.velocityY < -20) {
                    // Показываем уведомление о высоком прыжке
                    this.showNotification('👓 Супер-прыжок активирован!');
                    
                    // Создаем эффект высокого прыжка
                    for (let i = 0; i < 10; i++) {
                        this.particles.createJumpEffect(
                            this.player.x + Math.random() * this.player.width, 
                            this.player.y + this.player.height + Math.random() * 20
                        );
                    }
                }
                
                // Проверка на получение двойных монет (для золотого скина)
                // Remove the periodic notification that was showing too frequently
                /*if (this.player.doubleCoinsChance > 0 && this.player.skin === 'gold' && 
                    Math.random() < 0.01) {
                    // Периодически показываем напоминание о бонусе
                    this.showNotification('💎 Шанс двойных монет активен!');
                }*/
                
                // Создание двойных монет на платформах для золотого скина
                if (this.player && this.player.skin === 'gold') {
                    this.platforms.forEach(platform => {
                        // Если на платформе есть одна монета и она еще не собрана
                        if (platform.coin && !platform.coin.collected && !platform.hasDoubledCoins && Math.random() < 0.3) {
                            // Добавляем вторую монету рядом с существующей
                            const secondCoin = new Coin(
                                platform.coin.x + 25, // Позиционируем справа от первой монеты
                                platform.coin.y
                            );
                            platform.secondCoin = secondCoin;
                            platform.hasDoubledCoins = true; // Отмечаем, чтобы избежать добавления большего количества монет
                        }
                    });
                }
            }

            draw() {
                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;

                // Clear canvas
                this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                this.ctx.fillStyle = '#E0F7FA';
                this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Draw game elements
                this.platforms.forEach(platform => platform.draw(this.ctx));
                this.particles.draw(this.ctx);
                this.player.draw(this.ctx);

                // Draw UI
                this.ctx.fillStyle = '#000';
                this.ctx.font = '20px Arial';
                this.ctx.fillText(`Счёт: ${this.score}`, 10, 30);
                this.ctx.fillText(`Рекорд: ${this.highScore}`, 10, 60);

                // Draw game over screen
                if (this.gameOver) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '40px Arial';
                    this.ctx.fillText('Игра окончена!', canvasWidth/2 - 120, canvasHeight/2 - 40);
                    this.ctx.font = '20px Arial';
                    this.ctx.fillText(`Итоговый счёт: ${this.score}`, canvasWidth/2 - 80, canvasHeight/2);
                    this.ctx.fillText(`Монеты: ${this.coins}`, canvasWidth/2 - 50, canvasHeight/2 + 30);
                    
                    // Принудительно показываем контейнер с кнопками и сами кнопки
                    const controlButtons = document.getElementById('controlButtons');
                    const restartBtn = document.getElementById('restartBtn');
                    const shopBtnInGame = document.getElementById('shopBtnInGame');
                    
                    if (controlButtons) {
                        controlButtons.style.display = 'flex';
                        
                        // Определяем ориентацию кнопок в зависимости от ширины экрана
                        if (window.innerWidth <= 480) {
                            controlButtons.style.flexDirection = 'column';
                        } else {
                            controlButtons.style.flexDirection = 'row';
                        }
                    }
                    
                    if (restartBtn) {
                        restartBtn.style.display = 'block';
                        restartBtn.style.visibility = 'visible';
                    }
                    
                    if (shopBtnInGame) {
                        shopBtnInGame.style.display = 'block';
                        shopBtnInGame.style.visibility = 'visible';
                    }
                }
            }
            
            hideInstructions() {
                const instructions = document.getElementById('gameInstructions');
                if (instructions) {
                    instructions.style.display = 'none';
                }
            }
            
            updateCoinCounter() {
                const coinCounter = document.getElementById('coinCounter');
                if (coinCounter) {
                    coinCounter.textContent = this.coins;
                }
            }
            
            initShop() {
                const shopItemsContainer = document.querySelector('.shop-items');
                shopItemsContainer.innerHTML = '';
                
                // Create shop items
                this.shopItems.forEach(item => {
                    const isOwned = this.ownedSkins.includes(item.id);
                    const isSelected = this.player.skin === item.id;
                    
                    const itemElement = document.createElement('div');
                    itemElement.className = `shop-item${isOwned ? ' owned' : ''}${isSelected ? ' selected' : ''}${item.premium ? ' premium' : ''}`;
                    itemElement.dataset.id = item.id;
                    
                    const imageElement = document.createElement('div');
                    imageElement.className = 'shop-item-image';
                    
                    // Use emoji instead of image
                    const emoji = document.createElement('span');
                    emoji.textContent = item.emoji || '🎮';
                    emoji.style.fontSize = '32px';
                    imageElement.appendChild(emoji);
                    
                    const nameElement = document.createElement('div');
                    nameElement.className = 'shop-item-name';
                    nameElement.textContent = item.name;
                    
                    const priceElement = document.createElement('div');
                    priceElement.className = 'shop-item-price';
                    
                    if (isOwned) {
                        priceElement.textContent = 'Куплено';
                    } else if (item.premium) {
                        priceElement.innerHTML = `${item.price} <span class="or-text">или</span> ${this.telegramStarsPrices[item.id]} <span class="stars-icon">⭐</span>`;
                    } else {
                        priceElement.textContent = item.price;
                    }
                    
                    const descElement = document.createElement('div');
                    descElement.className = 'shop-item-description';
                    descElement.textContent = item.description;
                    
                    itemElement.appendChild(imageElement);
                    itemElement.appendChild(nameElement);
                    itemElement.appendChild(priceElement);
                    itemElement.appendChild(descElement);
                    
                    // Обработчик клика для десктопа
                    itemElement.addEventListener('click', () => {
                        this.selectShopItem(itemElement, item.id);
                    });
                    
                    // Обработчик для мобильных устройств
                    itemElement.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        this.selectShopItem(itemElement, item.id);
                    }, { passive: false });
                    
                    shopItemsContainer.appendChild(itemElement);
                });
                
                // Добавляем кнопку покупки за звезды
                const buyStarsButton = document.createElement('button');
                buyStarsButton.id = 'buyStarsButton';
                buyStarsButton.className = 'shop-button stars';
                buyStarsButton.textContent = 'Купить за звезды';
                buyStarsButton.style.display = 'none';
                
                buyStarsButton.addEventListener('click', () => {
                    this.handleBuyWithStars();
                });
                
                buyStarsButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleBuyWithStars();
                }, { passive: false });
                
                document.querySelector('.shop-buttons').appendChild(buyStarsButton);
                
                // Set up close button
                const closeButton = document.getElementById('closeShopButton');
                closeButton.addEventListener('click', () => {
                    document.getElementById('shopModal').style.display = 'none';
                });
                
                // Обработчик для мобильных устройств
                closeButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    document.getElementById('shopModal').style.display = 'none';
                }, { passive: false });
            }
            
            // Выделение элемента в магазине
            selectShopItem(itemElement, itemId) {
                // Deselect all items
                document.querySelectorAll('.shop-item').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Select this item
                itemElement.classList.add('selected');
                
                // Update buy button state
                this.updateBuyButtonState(itemId);
                
                // If the skin is owned, automatically set it as the selected skin
                if (this.ownedSkins.includes(itemId)) {
                    this.player.setSkin(itemId);
                    this.showShopMessage('Скин выбран!');
                }
            }
            
            // Обработка нажатия кнопки покупки
            handleBuyButton() {
                const selectedItem = document.querySelector('.shop-item.selected');
                if (!selectedItem) return;
                
                const itemId = selectedItem.dataset.id;
                const item = this.shopItems.find(i => i.id === itemId);
                
                if (this.ownedSkins.includes(itemId)) {
                    // Already owned, just equip it
                    this.player.setSkin(itemId);
                    this.showShopMessage('Скин выбран!');
                } else if (this.coins >= item.price) {
                    // Buy the skin
                    this.coins -= item.price;
                    this.ownedSkins.push(itemId);
                    localStorage.setItem('doodleJumpCoins', this.coins);
                    localStorage.setItem('doodleJumpOwnedSkins', JSON.stringify(this.ownedSkins));
                    this.updateCoinCounter();
                    
                    // Mark as owned in UI
                    selectedItem.classList.add('owned');
                    selectedItem.querySelector('.shop-item-price').textContent = 'Куплено';
                    
                    // Equip the skin
                    this.player.setSkin(itemId);
                    this.showShopMessage('Скин успешно куплен и выбран!');
                } else {
                    // Not enough coins
                    this.showShopMessage('Недостаточно монет!');
                }
                
                // Update buy button state
                this.updateBuyButtonState(itemId);
                
                // Update all shop items to reflect the new selection
                document.querySelectorAll('.shop-item').forEach(item => {
                    if (item.dataset.id === itemId) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });
            }
            
            // Обработка покупки за звезды
            handleBuyWithStars() {
                const selectedItem = document.querySelector('.shop-item.selected');
                if (!selectedItem) return;
                
                const itemId = selectedItem.dataset.id;
                const item = this.shopItems.find(i => i.id === itemId);
                
                if (!item.premium) return;
                
                // Здесь должна быть интеграция с Telegram Stars API
                // Пока просто имитируем успешную покупку
                this.showShopMessage('Покупка за Telegram Stars...');
                
                setTimeout(() => {
                    // Имитация успешной покупки
                    this.ownedSkins.push(itemId);
                    localStorage.setItem('doodleJumpOwnedSkins', JSON.stringify(this.ownedSkins));
                    
                    // Mark as owned in UI
                    selectedItem.classList.add('owned');
                    selectedItem.querySelector('.shop-item-price').textContent = 'Куплено';
                    
                    // Equip the skin
                    this.player.setSkin(itemId);
                    this.showShopMessage('🎉 Поздравляем! Премиум-скин успешно куплен за Telegram Stars!');
                    
                    // Update buy button state
                    this.updateBuyButtonState(itemId);
                }, 1000);
            }
            
            updateBuyButtonState(itemId) {
                const buyStarsButton = document.getElementById('buyStarsButton');
                if (!buyStarsButton) return;
                
                const item = this.shopItems.find(i => i.id === itemId);
                
                if (this.ownedSkins.includes(itemId)) {
                    buyStarsButton.style.display = 'none';
                } else if (item.premium) {
                    // Show stars button only if available
                    if (this.telegramStarsAvailable) {
                        buyStarsButton.style.display = 'block';
                        buyStarsButton.textContent = `Купить (${this.telegramStarsPrices[itemId]} ⭐)`;
                    } else {
                        buyStarsButton.style.display = 'none';
                    }
                } else {
                    buyStarsButton.style.display = 'none';
                }
            }
            
            showShopMessage(message) {
                const messageElement = document.getElementById('shopMessage');
                messageElement.textContent = message;
                
                // Clear message after 3 seconds
                setTimeout(() => {
                    messageElement.textContent = '';
                }, 3000);
            }
            
            openShop() {
                document.getElementById('shopModal').style.display = 'flex';
                
                // Select the current skin
                document.querySelectorAll('.shop-item').forEach(item => {
                    item.classList.remove('selected');
                    if (item.dataset.id === this.player.skin) {
                        item.classList.add('selected');
                    }
                });
                
                // Update buy button state
                this.updateBuyButtonState(this.player.skin);
            }
            
            // Helper method to show notification about active skin abilities
            showSkinAbilityNotification() {
                if (!this.player || !this.player.skin || this.player.skin === 'default') return;
                
                let message = '';
                switch(this.player.skin) {
                    case 'hat':
                        message = '🎩 Шляпа защитит вас от одного падения!';
                        break;
                    case 'glasses':
                        message = '👓 Дважды нажмите для супер-прыжка!';
                        break;
                    case 'clothes':
                        message = '👕 Вы выглядите стильно в этой одежде!';
                        break;
                    case 'gold':
                        message = '💎 Шанс двойных монет активирован!';
                        break;
                    case 'fire':
                        message = '🔥 Огненный след активирован!';
                        break;
                }
                
                if (message) {
                    this.showNotification(message);
                }
            }
            
            // Метод для создания эффекта телепортации
            showTeleportEffect() {
                // Создаем круговой эффект вокруг игрока
                const centerX = this.player.x + this.player.width / 2;
                const centerY = this.player.y + this.player.height / 2;
                
                // Create more particles for a more dramatic effect
                for (let i = 0; i < 50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 60 + 20;
                    
                    this.player.fireParticles.push({
                        x: centerX + Math.cos(angle) * distance,
                        y: centerY + Math.sin(angle) * distance,
                        size: Math.random() * 6 + 3,
                        speedX: Math.cos(angle) * (Math.random() * 3 + 2),
                        speedY: Math.sin(angle) * (Math.random() * 3 + 2),
                        life: 1.0,
                        color: '#8B4513'
                    });
                }
                
                // Add a flash effect
                const flash = document.createElement('div');
                flash.style.position = 'absolute';
                flash.style.top = '0';
                flash.style.left = '0';
                flash.style.width = '100%';
                flash.style.height = '100%';
                flash.style.backgroundColor = 'rgba(139, 69, 19, 0.3)';
                flash.style.zIndex = '500';
                flash.style.pointerEvents = 'none';
                flash.style.opacity = '0.7';
                flash.style.transition = 'opacity 0.5s ease-out';
                
                document.getElementById('gameContainer').appendChild(flash);
                
                setTimeout(() => {
                    flash.style.opacity = '0';
                    setTimeout(() => {
                        flash.remove();
                    }, 500);
                }, 100);
            }
            
            // Метод для показа уведомлений
            showNotification(message, color = '#FFD700', duration = 3000) {
                // Проверка, чтобы не создавать дублирующие уведомления
                if (document.getElementById('customNotification')) return;
                
                // Create a temporary notification element
                const notification = document.createElement('div');
                notification.id = 'customNotification';
                notification.style.position = 'absolute';
                notification.style.top = '10px';
                notification.style.left = '50%';
                notification.style.transform = 'translateX(-50%)';
                notification.style.background = '#000';
                notification.style.color = color;
                notification.style.padding = '10px 20px';
                notification.style.borderRadius = '12px';
                notification.style.fontSize = '16px';
                notification.style.fontWeight = 'bold';
                notification.style.zIndex = '1000';
                notification.style.textAlign = 'center';
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.4s ease';
                notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                notification.textContent = message;
                
                document.getElementById('gameContainer').appendChild(notification);
                
                // Fade in
                setTimeout(() => {
                    notification.style.opacity = '1';
                }, 50);
                
                // Store the timeout to be able to clear it if needed
                this.notificationTimeout = setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                        this.notificationTimeout = null;
                    }, 400);
                }, duration);
            }

            // Show shop modal
            showShop() {
                // Если игра закончилась, скрыть кнопки рестарта и магазина
                if (this.gameOver) {
                    this.hideRestartButton();
                    this.hideShopButton();
                }

                // Показать модальное окно магазина
                const shopModal = document.getElementById('shopModal');
                shopModal.style.display = 'flex';

                // Обновляем отображение монет
                document.getElementById('shopCoins').textContent = this.coins;

                // Очищаем контейнер товаров
                const shopItemsContainer = document.getElementById('shopItems');
                shopItemsContainer.innerHTML = '';

                // Создаем элементы для каждого скина
                Object.keys(this.availableSkins).forEach(skinId => {
                    const skin = this.availableSkins[skinId];
                    
                    // Создаем элемент товара
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('shop-item');
                    if (skin.premium) {
                        itemElement.classList.add('premium');
                    }
                    
                    // Создаем изображение скина
                    const imageContainer = document.createElement('div');
                    imageContainer.classList.add('shop-item-image');
                    
                    // Создаем canvas для отрисовки скина
                    const skinCanvas = document.createElement('canvas');
                    skinCanvas.width = 60;
                    skinCanvas.height = 60;
                    const skinCtx = skinCanvas.getContext('2d');
                    
                    // Рисуем скин на canvas
                    const tempPlayer = new Player(30, 30, skinId);
                    tempPlayer.draw(skinCtx);
                    
                    imageContainer.appendChild(skinCanvas);
                    
                    // Создаем контейнер для информации
                    const infoElement = document.createElement('div');
                    infoElement.classList.add('shop-item-info');
                    
                    // Название скина
                    const nameElement = document.createElement('div');
                    nameElement.classList.add('shop-item-name');
                    nameElement.textContent = skin.name;
                    
                    // Описание скина
                    const descElement = document.createElement('div');
                    descElement.classList.add('shop-item-description');
                    descElement.textContent = skin.description || 'Классный скин для вашего персонажа!';
                    
                    // Контейнер для кнопок
                    const buttonsElement = document.createElement('div');
                    buttonsElement.classList.add('shop-item-buttons');
                    
                    // Проверяем, владеет ли игрок этим скином
                    const isOwned = this.ownedSkins.includes(skinId);
                    const isSelected = this.player.skin === skinId;
                    
                    // Если игрок владеет скином
                    if (isOwned) {
                        // Кнопка выбора скина
                        const selectButton = document.createElement('button');
                        selectButton.classList.add('shop-button', 'select');
                        selectButton.textContent = isSelected ? 'Выбрано' : 'Выбрать';
                        selectButton.disabled = isSelected;
                        
                        if (!isSelected) {
                            selectButton.addEventListener('click', () => {
                                this.selectSkin(skinId);
                                this.updateShopButtons(skinId);
                                this.showShopMessage(`Скин ${skin.name} выбран!`);
                            });
                        }
                        
                        buttonsElement.appendChild(selectButton);
                    } else {
                        // Кнопка покупки за монеты
                        const buyButton = document.createElement('button');
                        buyButton.classList.add('shop-button', 'buy');
                        buyButton.textContent = `${skin.price} 🪙`;
                        
                        // Проверяем, достаточно ли монет
                        const canBuy = this.coins >= skin.price;
                        buyButton.disabled = !canBuy;
                        
                        if (canBuy) {
                            buyButton.addEventListener('click', () => {
                                if (this.coins >= skin.price) {
                                    this.coins -= skin.price;
                                    this.ownedSkins.push(skinId);
                                    this.updateCoinCounter();
                                    this.saveGameState();
                                    
                                    // Обновляем кнопки
                                    this.showShop();
                                    this.showShopMessage(`Вы приобрели скин ${skin.name}!`);
                                }
                            });
                        }
                        
                        buttonsElement.appendChild(buyButton);
                        
                        // Если скин премиум, добавляем кнопку покупки за Stars
                        if (skin.premium) {
                            const orText = document.createElement('span');
                            orText.classList.add('or-text');
                            orText.textContent = 'или';
                            buttonsElement.appendChild(orText);
                            
                            const starsButton = document.createElement('button');
                            starsButton.classList.add('shop-button', 'stars');
                            starsButton.innerHTML = `<span class="stars-icon">⭐</span> Stars`;
                            
                            starsButton.addEventListener('click', () => {
                                this.buyWithTelegramStars(skinId);
                            });
                            
                            buttonsElement.appendChild(starsButton);
                        }
                    }
                    
                    // Собираем элементы
                    infoElement.appendChild(nameElement);
                    infoElement.appendChild(descElement);
                    infoElement.appendChild(buttonsElement);
                    
                    itemElement.appendChild(imageContainer);
                    itemElement.appendChild(infoElement);
                    
                    // Добавляем в контейнер магазина
                    shopItemsContainer.appendChild(itemElement);
                });
                
                // Устанавливаем обработчик для кнопки закрытия
                document.getElementById('closeShopButton').addEventListener('click', () => {
                    this.closeShop();
                });
            }

            // Clear any existing notifications
            clearNotifications() {
                if (this.notificationTimeout) {
                    clearTimeout(this.notificationTimeout);
                    this.notificationTimeout = null;
                }
                
                const existingNotification = document.getElementById('customNotification');
                if (existingNotification && existingNotification.parentNode) {
                    existingNotification.parentNode.removeChild(existingNotification);
                }
            }
            
            // Game loop method
            gameLoop() {
                // Обновление игры происходит только если игра не завершена
                if (!this.gameOver) {
                    this.update();
                }
                // Отрисовка происходит всегда
                this.draw();
                // Цикл продолжается всегда
                this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
            }
            
            // Start the game
            startGame() {
                console.log("Game.startGame() вызван");
                
                // Завершаем предыдущий игровой цикл, если он был запущен
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
                
                // Clear any existing notifications
                this.clearNotifications();
                
                this.gameStarted = true;
                this.gameOver = false;
                this.score = 0;
                this.platforms = [];
                this.coins = parseInt(localStorage.getItem('doodleJumpCoins')) || 0;
                this.powerUps = [];
                this.particles = new ParticleSystem();
                
                // Create initial platforms
                for (let i = 0; i < 7; i++) {
                    const x = Math.random() * (this.canvas.width - 60);
                    const y = i === 0 ? this.canvas.height - 50 : this.canvas.height - 100 - i * 80;
                    this.platforms.push(new Platform(x, y, 'normal'));
                }
                
                // Create player with the selected skin
                const selectedSkin = localStorage.getItem('doodleJumpSelectedSkin') || 'default';
                this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, selectedSkin);
                
                // Initialize player position on the first platform
                this.initializePlayerPosition();
                
                // Show skin ability notification if applicable
                this.showSkinAbilityNotification();
                
                // Show start message with instructions
                this.showStartMessage();
                
                // Start game loop
                this.gameLoop();
                
                // Hide start screen
                const startScreen = document.getElementById('startScreen');
                if (startScreen) {
                    startScreen.style.display = 'none';
                }
                
                // Show game UI
                const gameUI = document.getElementById('gameUI');
                if (gameUI) {
                    gameUI.style.display = 'block';
                }
                
                // Hide restart and shop buttons
                this.hideRestartButton();
                this.hideShopButton();
            }
            
            // Initialize player position on the first platform
            initializePlayerPosition() {
                const startingPlatform = this.platforms[0];
                this.player.x = startingPlatform.x + startingPlatform.width / 2 - this.player.width / 2;
                this.player.y = startingPlatform.y - this.player.height;
                this.player.velocityY = 0;
            }
            
            // Скрыть кнопку рестарта
            hideRestartButton() {
                const restartButton = document.getElementById('restartButton');
                if (restartButton) {
                    restartButton.style.display = 'none';
                }
            }
            
            // Скрыть кнопку магазина
            hideShopButton() {
                const shopButton = document.getElementById('shopButton');
                if (shopButton) {
                    shopButton.style.display = 'none';
                }
            }
            
            // Показать сообщение в магазине
            showShopMessage(message) {
                const messageElement = document.getElementById('shopMessage');
                if (messageElement) {
                    messageElement.textContent = message;
                    messageElement.style.display = 'block';
                    setTimeout(() => {
                        messageElement.style.display = 'none';
                    }, 3000);
                }
            }
            
            // Покупка с использованием Telegram Stars
            buyWithTelegramStars(skin) {
                // Здесь будет реализация покупки с использованием Telegram Stars
                // Пока просто показываем сообщение
                this.showShopMessage('Покупка за Stars скоро будет доступна!');
            }

            // Close shop modal
            closeShop() {
                const shopModal = document.getElementById('shopModal');
                if (shopModal) {
                    shopModal.style.display = 'none';
                } else {
                    console.error('Shop modal element not found!');
                }
            }

            // Set up event listeners
            setupEventListeners() {
                // Кнопка старта
                document.getElementById('startBtn').addEventListener('click', () => {
                    this.startGame();
                });

                // Кнопка перезапуска
                document.getElementById('restartButton').addEventListener('click', () => {
                    this.resetGame();
                });

                // Кнопка магазина в игре
                document.getElementById('shopButton').addEventListener('click', () => {
                    this.showShop();
                });

                // Кнопка закрытия магазина
                document.getElementById('closeShopButton').addEventListener('click', () => {
                    this.closeShop();
                });

                // Обработчики управления с клавиатуры
                const handleKeyDown = (e) => {
                    if (e.code === 'Space') {
                        if (this.gameOver) {
                            this.resetGame();
                        } else if (this.player.skin === 'glasses' && this.player.extraJumpAvailable) {
                            // Activate double jump with Space key
                            if (this.player.activateDoubleJump()) {
                                this.showNotification('👓 Супер-прыжок активирован!');
                                
                                // Create visual effect for double jump
                                for (let i = 0; i < 15; i++) {
                                    this.particles.createJumpEffect(
                                        this.player.x + Math.random() * this.player.width, 
                                        this.player.y + this.player.height + Math.random() * 20
                                    );
                                }
                            }
                        }
                    } else if (e.code === 'ArrowLeft') {
                        this.player.velocityX = -5;
                        this.hideInstructions();
                    } else if (e.code === 'ArrowRight') {
                        this.player.velocityX = 5;
                        this.hideInstructions();
                    }
                };

                const handleKeyUp = (e) => {
                    if (e.code === 'ArrowLeft' && this.player.velocityX < 0) {
                        this.player.velocityX = 0;
                    } else if (e.code === 'ArrowRight' && this.player.velocityX > 0) {
                        this.player.velocityX = 0;
                    }
                };

                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('keyup', handleKeyUp);

                // Обработчик для левой зоны касания
                const leftTouch = document.getElementById('leftTouch');
                if (leftTouch) {
                    leftTouch.addEventListener('touchstart', () => {
                        this.player.velocityX = -5;
                        this.hideInstructions();
                    });
                    
                    leftTouch.addEventListener('touchend', () => {
                        this.player.velocityX = 0;
                    });
                }
                
                // Обработчик для правой зоны касания
                const rightTouch = document.getElementById('rightTouch');
                if (rightTouch) {
                    rightTouch.addEventListener('touchstart', () => {
                        this.player.velocityX = 5;
                        this.hideInstructions();
                    });
                    
                    rightTouch.addEventListener('touchend', () => {
                        this.player.velocityX = 0;
                    });
                }

                // Обработчик изменения размера окна
                window.addEventListener('resize', () => {
                    this.resizeCanvas();
                });
            }

            // ... existing code ...
            // Выбрать скин
            selectSkin(skinId) {
                this.player.setSkin(skinId);
                localStorage.setItem('jumperBoxSelectedSkin', skinId);
                
                // Показываем способности скина, если они есть
                if (skinId !== 'default') {
                    this.showSkinAbilityNotification();
                }
            }
            
            // Сохранить состояние игры
            saveGameState() {
                localStorage.setItem('jumperBoxCoins', this.coins);
                localStorage.setItem('jumperBoxHighScore', this.highScore);
                localStorage.setItem('jumperBoxOwnedSkins', JSON.stringify(this.ownedSkins));
                localStorage.setItem('jumperBoxSelectedSkin', this.player.skin);
            }

            // Закрыть магазин
            closeShop() {
                const shopModal = document.getElementById('shopModal');
                if (shopModal) {
                    shopModal.style.display = 'none';
                }

                // Если игра закончилась, показать кнопки заново
                if (this.gameOver) {
                    // Показать кнопки рестарта и магазина
                    const restartButton = document.getElementById('restartButton');
                    if (restartButton) {
                        restartButton.style.display = 'block';
                    }
                    
                    const shopButton = document.getElementById('shopButton');
                    if (shopButton) {
                        shopButton.style.display = 'block';
                    }
                    
                    const controlButtons = document.getElementById('controlButtons');
                    if (controlButtons) {
                        controlButtons.style.display = 'flex';
                    }
                }
            }

            // Окончание игры
            endGame() {
                if (this.gameOver) return;
                
                // Сохраняем состояние игры
                this.gameOver = true;
                
                // Обновляем рекорд, если текущий счет больше
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('jumperBoxHighScore', this.highScore);
                }
                
                // Сохраняем количество монет
                localStorage.setItem('jumperBoxCoins', this.coins);
                
                // Показываем кнопки управления
                const controlButtons = document.getElementById('controlButtons');
                if (controlButtons) {
                    controlButtons.style.display = 'flex';
                }
                
                // Показываем кнопку рестарта
                const restartButton = document.getElementById('restartButton');
                if (restartButton) {
                    restartButton.style.display = 'block';
                }
                
                // Показываем кнопку магазина
                const shopButton = document.getElementById('shopButton');
                if (shopButton) {
                    shopButton.style.display = 'block';
                }
                
                // Добавляем класс game-over к контейнеру для стилизации
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    gameContainer.classList.add('game-over');
                }
                
                // Показываем экран окончания игры
                this.drawGameOver();
            }
        }

        // Initialize game
        document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const container = document.getElementById('gameContainer');
            const startScreen = document.getElementById('startScreen');
            const leftTouch = document.getElementById('leftTouch');
            const rightTouch = document.getElementById('rightTouch');
            
            let game = null;
            let gameStarted = false;
            
            // Initialize game
            function initGame() {
                console.log("initGame вызвана");
                console.log("canvas:", canvas);
                console.log("ctx:", ctx);
                
                if (!canvas) {
                    console.error("Canvas не найден!");
                    return;
                }
                
                if (!ctx) {
                    console.error("Контекст Canvas не получен!");
                    return;
                }
                
                game = new Game(canvas, ctx);
                console.log("Game создан:", game);
                game.init();
                console.log("Game инициализирован");
                
                // Инициализируем игру сразу
                document.getElementById('startBtn').addEventListener('click', () => {
                    console.log("Кнопка старта нажата");
                    if (game) {
                        game.startGame();
                        gameStarted = true;
                    }
                });
            }
            
            // Resize canvas based on device
            function resizeCanvas() {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                if (isMobile) {
                    // На мобильных устройствах используем всю доступную область
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    container.style.width = '100%';
                    container.style.height = '100%';
                    container.style.maxWidth = '100%';
                    container.style.maxHeight = '100vh';
                } else {
                    // На десктопе используем фиксированный размер
                    canvas.width = containerWidth;
                    canvas.height = containerHeight;
                }
                
                // Если игра уже инициализирована, обновляем позицию игрока
                if (game && game.player) {
                    // Убедимся, что игрок не выходит за границы
                    game.player.x = Math.min(Math.max(game.player.x, 0), canvas.width - game.player.width);
                }
            }
            
            // Mobile touch controls
            // Variables for double tap detection
            let lastTapTime = 0;
            const doubleTapDelay = 300; // ms between taps to count as double tap
            
            function handleTouchStart(direction) {
                if (!game) return;
                game.player.velocityX = direction === 'left' ? -5 : 5;
                game.hideInstructions();
                
                // Check for double tap to activate double jump
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                
                if (tapLength < doubleTapDelay && tapLength > 0) {
                    // Double tap detected
                    if (game.player.skin === 'glasses' && game.player.extraJumpAvailable) {
                        if (game.player.activateDoubleJump()) {
                            game.showNotification('👓 Супер-прыжок активирован!');
                            
                            // Create visual effect for double jump
                            for (let i = 0; i < 15; i++) {
                                game.particles.createJumpEffect(
                                    game.player.x + Math.random() * game.player.width, 
                                    game.player.y + game.player.height + Math.random() * 20
                                );
                            }
                        }
                    }
                }
                
                lastTapTime = currentTime;
            }
            
            function handleTouchEnd() {
                if (!game) return;
                game.player.velocityX = 0;
            }
            
            leftTouch.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTouchStart('left');
            }, { passive: false });
            
            rightTouch.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTouchStart('right');
            }, { passive: false });
            
            leftTouch.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleTouchEnd();
            }, { passive: false });
            
            rightTouch.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleTouchEnd();
            }, { passive: false });
            
            // Handle window resize
            window.addEventListener('resize', resizeCanvas);
            window.addEventListener('orientationchange', () => {
                setTimeout(resizeCanvas, 100);
            });
            
            // Initial setup
            resizeCanvas();
            // Initialize the game
            initGame();
        });
