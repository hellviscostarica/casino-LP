// Each card is generated as SVG so the suit and rank remain crisp at any size.
    function createPokerCardSVG(rank, suit, color, width, height) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" rx="${Math.max(10, width * 0.1)}" fill="#f8f8f8" stroke="#DAA520" stroke-width="${Math.max(2, width * 0.04)}"/>
          <text x="${width * 0.13}" y="${height * 0.18}" font-size="${Math.floor(width * 0.22)}" fill="${color}" font-weight="bold">${rank}</text>
          <text x="${width * 0.13}" y="${height * 0.36}" font-size="${Math.floor(width * 0.2)}" fill="${color}">${suit}</text>
          <text x="${width * 0.5}" y="${height * 0.6}" font-size="${Math.floor(width * 0.45)}" fill="${color}" text-anchor="middle">${suit}</text>
          <text x="${width * 0.87}" y="${height * 0.85}" font-size="${Math.floor(width * 0.22)}" fill="${color}" font-weight="bold" text-anchor="end">${rank}</text>
          <text x="${width * 0.87}" y="${height * 0.71}" font-size="${Math.floor(width * 0.2)}" fill="${color}" text-anchor="end">${suit}</text>
        </svg>
      `;
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    function initializePokerClock() {
      const wrap = document.getElementById('clockWrap');
      const clock = document.getElementById('pokerClock');
      const spinBtn = document.getElementById('spinBtn');
      const prevButtons = [...document.querySelectorAll('.arrow.left')];
      const nextButtons = [...document.querySelectorAll('.arrow.right')];

      // The values under the cards drive the clock layout and active-card logic.
      const cards = [
        { title: 'High Limits', description: 'Premium play' },
        { title: 'Fast Payouts', description: 'Instant cashout' },
        { title: 'Cash Boosts', description: 'Extra rewards' },
        { title: 'Dedicated Host', description: 'Personal service' },
        { title: 'VIP Access', description: 'Exclusive entry' },
        { title: 'Table Credits', description: 'Bonus chips' },
        { title: 'Priority Support', description: 'Fast assistance' },
        { title: 'Exclusive Events', description: 'Private access' },
        { title: 'Royal Suite', description: 'Luxury perks' },
        { title: 'Crypto Bonuses', description: 'Instant deposits' },
        { title: 'Cashback Rewards', description: 'Weekly returns' },
        { title: 'High Roller Club', description: 'Elite perks' },
        { title: 'Live Dealer Perks', description: 'Exclusive tables' },
        { title: 'Birthday Gifts', description: 'Special rewards' },
        { title: 'Reload Bonuses', description: 'Extra funds' },
        { title: 'Tournament Pass', description: 'Free entry' },
        { title: 'Express Cashout', description: 'Zero waiting' },
        { title: 'Daily Free Spins', description: 'Spin every day' },
        { title: 'Level Up Rewards', description: 'Tier upgrades' },
        { title: 'Loss Back Bonus', description: 'Safety net' },
        { title: 'Personal Manager', description: '24/7 VIP service' }
      ];

      const cardCount = cards.length;
      const visibleArc = 360;
      const arcStart = 0;
      const cardAngle = visibleArc / cardCount;
      let currentRotation = 0;
      let targetRotation = 0;
      let isAnimating = false;
      let isDragging = false;
      let dragMoved = false;
      let startX = 0;
      let startRotation = 0;
      let lastInteraction = Date.now();

      // Card dimensions are tuned for mobile and desktop without changing the logic.
      function getCardDimensions() {
        if (window.innerWidth <= 576) return { width: 44, height: 66 };
        if (window.innerWidth <= 768) return { width: 60, height: 90 };
        if (window.innerWidth <= 1024) return { width: 98, height: 146 };
        if (window.innerWidth <= 1400) return { width: 128, height: 190 };
        return { width: 170, height: 250 };
      }

      function isMobileView() {
        return window.innerWidth <= 767;
      }

      function getClockScale() {
        if (window.innerWidth <= 320) return 0.9;
        if (window.innerWidth <= 480) return 0.95;
        return 1;
      }

      function getRadius() {
        const base = Math.min(clock.clientWidth, clock.clientHeight);
        let radius = Math.min(base * 0.5, base / 2 - 4);

        if (isMobileView()) {
          // Push cards farther out so only the top card sits inside the visible area.
          radius = Math.max(base * 0.62, base / 2 + 8);

          if (window.innerWidth <= 320) {
            radius += 18;
          } else if (window.innerWidth <= 480) {
            radius += 12;
          }
        } else if (window.innerWidth <= 320) {
          radius += 34;
        } else if (window.innerWidth <= 480) {
          radius += 28;
        }

        return radius;
      }

      // Rotate the entire wheel and recompute card positions to keep the active item aligned.
      function setClockRotation() {
        updateCardPositions();
        clock.style.transform = `rotate(${currentRotation}deg) scale(${getClockScale()})`;
      }

      function renderCards() {
        clock.innerHTML = '';

        cards.forEach((card, index) => {
          const cardEl = document.createElement('div');
          cardEl.className = 'poker-card-clock';
          cardEl.dataset.index = index;
          cardEl.innerHTML = `
            <div class="card-content">
              <div class="card-title">${card.title}</div>
              <div class="card-description">${card.description}</div>
            </div>
          `;
          clock.appendChild(cardEl);
        });

        updateCardPositions();
      }

      function updateCardPositions() {
        const radius = getRadius();
        clock.querySelectorAll('.poker-card-clock').forEach((card, index) => {
          const angle = arcStart + index * cardAngle;
          card.style.transform = `rotate(${angle}deg) translateY(-${radius}px)`;
        });
      }

      function normalizeArcRotation(value) {
        let normalized = value % 360;

        if (normalized > 180) normalized -= 360;
        if (normalized < -180) normalized += 360;

        return normalized;
      }

      // Highlights the card currently closest to the top of the wheel.
      function updateActiveCard() {
        const cardEls = clock.querySelectorAll('.poker-card-clock');
        const topPosition = ((-currentRotation % 360) + 360) % 360;
        const activeIndex = Math.round(topPosition / cardAngle) % cardCount;

        cardEls.forEach((el, index) => el.classList.toggle('active', index === activeIndex));
      }

      function easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }

      // The animation keeps each spin smooth while still snapping to the nearest item.
      function spinTo(newTargetRotation) {
        const startRotation = currentRotation;
        let distance = newTargetRotation - startRotation;

        while (distance > 180) distance -= 360;
        while (distance < -180) distance += 360;

        targetRotation = startRotation + distance;
        lastInteraction = Date.now();
        if (isAnimating) return;

        isAnimating = true;
        const duration = 1000;
        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutBack(progress);
          currentRotation = startRotation + distance * eased;
          setClockRotation();
          updateActiveCard();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            currentRotation = targetRotation;
            setClockRotation();
            updateActiveCard();
            isAnimating = false;
          }
        }

        requestAnimationFrame(animate);
      }

      function snapToNearestHour() {
        const nearest = Math.round(currentRotation / cardAngle) * cardAngle;
        spinTo(nearest);
      }

      function spinNext() { spinTo(targetRotation - cardAngle); }
      function spinPrev() { spinTo(targetRotation + cardAngle); }

      function spinRandom() {
        const randomSpins = Math.floor(Math.random() * 3) + 2;
        const randomCard = Math.floor(Math.random() * cardCount);
        const totalRotation = normalizeArcRotation((targetRotation - 360 * randomSpins) - (randomCard * cardAngle));
        spinTo(totalRotation);
      }

      function rotateCardToTop(index) {
        const targetCardRotation = index * cardAngle;
        const normalizedRotation = ((-currentRotation % 360) + 360) % 360;
        let diff = targetCardRotation - normalizedRotation;
        diff = ((diff + 180) % 360) - 180;
        if (diff < -180) diff += 360;
        spinTo(currentRotation + diff);
      }

      prevButtons.forEach((btn) => {
        btn.addEventListener('click', () => { dragMoved = false; spinPrev(); });
      });

      nextButtons.forEach((btn) => {
        btn.addEventListener('click', () => { dragMoved = false; spinNext(); });
      });

      spinBtn.addEventListener('click', () => { dragMoved = false; spinRandom(); });

      // Clicking a card rotates the wheel to bring that reward to the top.
      clock.addEventListener('click', (event) => {
        if (dragMoved) {
          dragMoved = false;
          return;
        }
        const card = event.target.closest('.poker-card-clock');
        if (!card) return;
        rotateCardToTop(Number(card.dataset.index));
      });

      // Dragging lets the user manually rotate the wheel without disrupting the card logic.
      function startDrag(clientX) {
        isDragging = true;
        dragMoved = false;
        startX = clientX;
        startRotation = currentRotation;
        clock.style.cursor = 'grabbing';
      }

      function moveDrag(clientX) {
        if (!isDragging) return;
        const deltaX = clientX - startX;
        if (Math.abs(deltaX) > 3) dragMoved = true;
        currentRotation = startRotation + deltaX * 0.25;
        setClockRotation();
        updateActiveCard();
      }

      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        clock.style.cursor = 'grab';
        targetRotation = currentRotation;
        snapToNearestHour();
      }

      clock.addEventListener('mousedown', (event) => startDrag(event.clientX));
      window.addEventListener('mousemove', (event) => moveDrag(event.clientX));
      window.addEventListener('mouseup', endDrag);
      clock.addEventListener('touchstart', (event) => startDrag(event.touches[0].clientX), { passive: true });
      window.addEventListener('touchmove', (event) => moveDrag(event.touches[0].clientX), { passive: true });
      window.addEventListener('touchend', endDrag);

      // Auto-spin keeps the clock moving when no interaction is happening.
      let autoSpinId = null;
      function startAutoSpin() {
        if (autoSpinId) return;
        autoSpinId = setInterval(() => {
          if (Date.now() - lastInteraction < 4000) return;
          if (isDragging || isAnimating) return;
          spinTo(targetRotation - cardAngle);
        }, 3500);
      }

      function stopAutoSpin() {
        if (autoSpinId) {
          clearInterval(autoSpinId);
          autoSpinId = null;
        }
      }

      wrap.addEventListener('mouseenter', stopAutoSpin);
      wrap.addEventListener('mouseleave', startAutoSpin);
      wrap.addEventListener('touchstart', () => { lastInteraction = Date.now(); stopAutoSpin(); }, { passive: true });
      wrap.addEventListener('touchend', startAutoSpin);

      window.addEventListener('resize', () => {
        renderCards();
        setClockRotation();
        updateActiveCard();
      });

      renderCards();
      updateActiveCard();
      startAutoSpin();
    }

    document.addEventListener('DOMContentLoaded', initializePokerClock);