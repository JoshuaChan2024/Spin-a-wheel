
/* ==========================================
   1. GET HTML ELEMENTS
========================================== */

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinButton = document.getElementById("spin-button");
const optionForm = document.getElementById("option-form");
const optionInput = document.getElementById("option-input");
const optionList = document.getElementById("option-list");
const clearButton = document.getElementById("clear-button");
const result = document.getElementById("result");


/* ==========================================
   2. INITIALISE OPTIONS
========================================== */

let options = Array.from(optionList.querySelectorAll("li"))
    .map(item => {
        const span = item.querySelector("span");

        if (span) {
            return span.textContent.trim();
        }

        // Remove button text from the initial option.
        const clone = item.cloneNode(true);
        clone.querySelectorAll("button").forEach(button => button.remove());

        return clone.textContent.trim();
    })
    .filter(Boolean);

let rotation = 0;
let isSpinning = false;

const colors = [
    "#7c3aed",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
    "#f97316"
];


/* ==========================================
   3. DRAW THE WHEEL
========================================== */

function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (options.length === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#e5e7eb";
        ctx.fill();

        ctx.fillStyle = "#374151";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Add some options!", centerX, centerY);

        return;
    }

    const sliceAngle = (Math.PI * 2) / options.length;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    options.forEach((option, index) => {
        const startAngle = -Math.PI / 2 + index * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const middleAngle = startAngle + sliceAngle / 2;

        /* Draw the segment */

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();


        /* Draw the label */

        ctx.save();
        ctx.rotate(middleAngle);

        // Keep text upright on either side of the wheel.
        const flipped = Math.cos(middleAngle) < 0;
        if (flipped) {
            ctx.rotate(Math.PI);
        }

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";

        const hubRadius = 24;
        const padding = 12;

        // Text runs from near the hub out to near the rim.
        const textEnd = radius - padding;
        const availableWidth = textEnd - (hubRadius + padding);

        const maxFontSize = 32;
        const minFontSize = 5;

        // Start big and shrink until the label fits the length AND the slice thickness.
        let fontSize = maxFontSize;

        while (fontSize > minFontSize) {
            ctx.font = `bold ${fontSize}px Arial`;

            const textWidth = ctx.measureText(option).width;
            const innerRadius = textEnd - textWidth;

            // How tall the slice is at the inner end of the text.
            const sliceHeight =
                2 * innerRadius *
                Math.sin(Math.min(sliceAngle / 2, Math.PI / 2)) * 0.8;

            if (textWidth <= availableWidth && fontSize <= sliceHeight) {
                break;
            }

            fontSize--;
        }

        ctx.font = `bold ${fontSize}px Arial`;

        // If it still doesn't fit at the minimum size, shorten only the wheel label.
        let displayLabel = option;

        if (ctx.measureText(displayLabel).width > availableWidth) {
            while (
                displayLabel.length > 1 &&
                ctx.measureText(displayLabel + "…").width > availableWidth
            ) {
                displayLabel = displayLabel.slice(0, -1);
            }

            displayLabel += "…";
        }

        // Anchor the text at the rim. After the 180° flip, the rim is on the negative side.
        ctx.textAlign = flipped ? "left" : "right";
        ctx.fillText(displayLabel, flipped ? -textEnd : textEnd, 0);

        ctx.restore();
    });


    /* Draw the centre hub */

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.strokeStyle = "#6d28d9";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
}


/* ==========================================
   4. RENDER THE OPTIONS LIST
========================================== */

function renderOptions() {
    optionList.innerHTML = "";

    options.forEach((option, index) => {
        const listItem = document.createElement("li");

        const optionText = document.createElement("span");
        optionText.textContent = option;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${option}`);

        removeButton.style.marginLeft = "10px";
        removeButton.style.padding = "6px 10px";
        removeButton.style.backgroundColor = "#ef4444";
        removeButton.style.color = "#ffffff";

        removeButton.addEventListener("click", () => {
            if (isSpinning) return;

            options.splice(index, 1);

            result.textContent = "Your result will appear here!";

            renderOptions();
            drawWheel();
        });

        listItem.appendChild(optionText);
        listItem.appendChild(removeButton);
        optionList.appendChild(listItem);
    });

    spinButton.disabled = isSpinning || options.length === 0;
    clearButton.disabled = isSpinning || options.length === 0;
}


/* ==========================================
   5. ADD AN OPTION
========================================== */

optionForm.addEventListener("submit", event => {
    event.preventDefault();

    if (isSpinning) return;

    const newOption = optionInput.value.trim();

    if (!newOption) {
        result.textContent = "Please enter an option.";
        optionInput.focus();
        return;
    }

    options.push(newOption);
    optionInput.value = "";

    result.textContent = "Your result will appear here!";

    renderOptions();
    drawWheel();

    optionInput.focus();
});


/* ==========================================
   6. SPIN THE WHEEL
========================================== */

spinButton.addEventListener("click", () => {
    if (isSpinning || options.length === 0) return;

    isSpinning = true;
    renderOptions();

    result.textContent = "The wheel is spinning...";

    // Randomly choose the winning segment.
    const winnerIndex = Math.floor(Math.random() * options.length);
    const winner = options[winnerIndex];

    const sliceAngle = (Math.PI * 2) / options.length;
    const fullCircle = Math.PI * 2;

    // Centre of the winning segment aligns with the top pointer.
    const targetRotation = -(winnerIndex + 0.5) * sliceAngle;

    const fullTurns = 5 + Math.floor(Math.random() * 4);

    const extraRotation =
        ((targetRotation - rotation) % fullCircle + fullCircle) %
        fullCircle;

    const startRotation = rotation;
    const endRotation = rotation + fullTurns * fullCircle + extraRotation;

    const duration = 4000;
    const startTime = performance.now();

    function animateWheel(currentTime) {
        const progress = Math.min(
            (currentTime - startTime) / duration,
            1
        );

        // Smoothly decelerate towards the final position.
        const easedProgress = 1 - Math.pow(1 - progress, 4);

        rotation =
            startRotation + (endRotation - startRotation) * easedProgress;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
            return;
        }

        rotation = endRotation % fullCircle;
        drawWheel();

        result.textContent = `🎉 The winner is: ${winner}!`;

        isSpinning = false;
        renderOptions();
    }

    requestAnimationFrame(animateWheel);
});

/* ==========================================
   7. CLEAR ALL OPTIONS
========================================== */

clearButton.addEventListener("click", () => {
    if (isSpinning || options.length === 0) return;

    options = [];

    result.textContent = "Your result will appear here!";

    renderOptions();
    drawWheel();
});


/* ==========================================
   8. INITIALISE THE WEBSITE
========================================== */

renderOptions();
drawWheel();
