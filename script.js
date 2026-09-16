document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let is24HourFormat = false;
    const userNameEl = document.getElementById('user-name');
    const toggleFormatBtn = document.getElementById('toggle-format');
    const copyTimeBtn = document.getElementById('copy-time-btn');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');

    // Load saved preferences
    initPreferences();

    // Start Clock Loop
    updateClock();
    setInterval(updateClock, 30); // smooth millisecond update

    // Initialize Canvas Background
    initParticleCanvas();

    // Event Listeners
    setupEventListeners();

    /* ==========================================================================
       Clock Logic & Timezone Handling
       ========================================================================== */
    function updateClock() {
        const now = new Date();

        // Hours, Minutes, Seconds, Milliseconds
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const millis = now.getMilliseconds();

        // AM/PM calculation
        const ampm = hours >= 12 ? 'PM' : 'AM';
        if (!is24HourFormat) {
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 becomes 12
        }

        // Format strings
        const strHours = String(hours).padStart(2, '0');
        const strMinutes = String(minutes).padStart(2, '0');
        const strSeconds = String(seconds).padStart(2, '0');
        const strMillis = '.' + String(millis).padStart(3, '0');

        // Update Digits DOM
        document.getElementById('clock-hours').textContent = strHours;
        document.getElementById('clock-minutes').textContent = strMinutes;
        document.getElementById('clock-seconds').textContent = strSeconds;
        document.getElementById('clock-millis').textContent = strMillis;

        const ampmEl = document.getElementById('clock-ampm');
        if (is24HourFormat) {
            ampmEl.style.display = 'none';
        } else {
            ampmEl.style.display = 'inline-block';
            ampmEl.textContent = ampm;
        }

        // Circular Progress Ring (Seconds + Millis smoothness)
        const secondProgressCircle = document.getElementById('second-progress');
        if (secondProgressCircle) {
            const circumference = 2 * Math.PI * 130; // r = 130
            const totalSecondsFraction = seconds + (millis / 1000);
            const offset = circumference - (totalSecondsFraction / 60) * circumference;
            secondProgressCircle.style.strokeDashoffset = offset;
        }

        // Full Date Display
        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('full-date').textContent = now.toLocaleDateString(undefined, optionsDate);

        // Timezone display
        const tzOffsetMinutes = -now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
        const offsetMins = Math.abs(tzOffsetMinutes) % 60;
        const sign = tzOffsetMinutes >= 0 ? '+' : '-';
        const formattedOffset = `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
        
        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
        document.getElementById('tz-name').textContent = `${formattedOffset} (${tzName})`;

        // Dynamic Time-based Greeting
        updateGreeting(now.getHours());

        // Update World Clocks
        updateWorldClocks(now);
    }

    function updateGreeting(currentHour) {
        const greetingBadge = document.getElementById('greeting-badge');
        const greetingIcon = document.getElementById('greeting-icon');
        const greetingText = document.getElementById('greeting-text');

        if (currentHour >= 5 && currentHour < 12) {
            greetingText.textContent = 'Good Morning';
            greetingIcon.className = 'fa-solid fa-sun';
        } else if (currentHour >= 12 && currentHour < 18) {
            greetingText.textContent = 'Good Afternoon';
            greetingIcon.className = 'fa-solid fa-cloud-sun';
        } else {
            greetingText.textContent = 'Good Evening';
            greetingIcon.className = 'fa-solid fa-moon';
        }
    }

    function updateWorldClocks(now) {
        const timezones = [
            { id: 'time-london', tz: 'Europe/London' },
            { id: 'time-ny', tz: 'America/New_York' },
            { id: 'time-tokyo', tz: 'Asia/Tokyo' },
            { id: 'time-sf', tz: 'America/Los_Angeles' }
        ];

        timezones.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                try {
                    const timeStr = now.toLocaleTimeString('en-US', {
                        timeZone: item.tz,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: !is24HourFormat
                    });
                    el.textContent = timeStr;
                } catch (e) {
                    el.textContent = '--:--';
                }
            }
        });
    }

    /* ==========================================================================
       User Preferences & Interactivity
       ========================================================================== */
    function initPreferences() {
        // Name Persistence
        const savedName = localStorage.getItem('user_name');
        if (savedName) {
            userNameEl.textContent = savedName;
        }

        // Format Persistence
        const savedFormat = localStorage.getItem('clock_format_24h');
        if (savedFormat === 'true') {
            is24HourFormat = true;
            toggleFormatBtn.textContent = '24H Format';
        }

        // Theme Persistence
        const savedTheme = localStorage.getItem('user_theme') || 'aurora';
        setTheme(savedTheme);
    }

    function setupEventListeners() {
        // Editable Name Save
        userNameEl.addEventListener('blur', () => {
            const newName = userNameEl.textContent.trim() || 'dainosososo';
            userNameEl.textContent = newName;
            localStorage.setItem('user_name', newName);
            showToast(`Name updated to "${newName}"`);
        });

        userNameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                userNameEl.blur();
            }
        });

        // Toggle 12h / 24h
        toggleFormatBtn.addEventListener('click', () => {
            is24HourFormat = !is24HourFormat;
            toggleFormatBtn.textContent = is24HourFormat ? '24H Format' : '12H Format';
            localStorage.setItem('clock_format_24h', is24HourFormat);
            showToast(`Switched to ${is24HourFormat ? '24-hour' : '12-hour'} format`);
            updateClock();
        });

        // Theme Switcher Buttons
        document.querySelectorAll('[data-set-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeName = btn.getAttribute('data-set-theme');
                setTheme(themeName);
            });
        });

        // Copy Timestamp Button
        copyTimeBtn.addEventListener('click', () => {
            const isoString = new Date().toISOString();
            navigator.clipboard.writeText(isoString).then(() => {
                showToast('ISO Timestamp copied!');
            }).catch(() => {
                showToast('Failed to copy timestamp');
            });
        });
    }

    function setTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('user_theme', themeName);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.getAttribute('data-set-theme') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2600);
    }

    /* ==========================================================================
       Interactive Canvas Particle Background
       ========================================================================== */
    function initParticleCanvas() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        let particles = [];
        const particleCount = 45;

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.radius = Math.random() * 2 + 1;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            // Draw particles and faint connection lines
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
    }
});
