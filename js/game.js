// Dashboard + game logic
const BACKEND_URL = "https://rmb-bingo-backend.onrender.com"; // Replace with your Render backend URL

// Protect page: ensure session exists
(function () {
  const user = sessionStorage.getItem("rmb_session");
  if (!user) {
    console.warn("No session found; proceeding as guest.");
  }
})();

// Connect to backend Socket.IO
const socket = io(BACKEND_URL);
socket.on("connect", () => {
  console.log("Connected to backend via Socket.IO");
});
socket.on("players:count", (data) => {
  document.getElementById("playersCount").innerText = data.count;
});

// Generate bingo card
function generateBingoCard() {
  const board = document.getElementById("bingoCard");
  board.innerHTML = "";
  const nums = [];
  while (nums.length < 24) {
    const n = Math.floor(Math.random() * 75) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    if (i === 12) {
      cell.innerText = "FREE";
      cell.classList.add("active");
    } else {
      cell.innerText = nums.pop();
      cell.addEventListener("click", () =>
        cell.classList.toggle("active")
      );
    }
    board.appendChild(cell);
  }
}
generateBingoCard();

// Demo round logic (client-only)
let drawn = [];
function startDemoRound() {
  drawn = [];
  const maxDraws = 30;
  let draws = 0;
  const all = Array.from({ length: 75 }, (_, i) => i + 1);
  const interval = setInterval(() => {
    if (draws >= maxDraws) {
      clearInterval(interval);
      alert("Demo round ended");
      return;
    }
    const remaining = all.filter((n) => !drawn.includes(n));
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    drawn.push(pick);
    draws++;
    highlightNumber(pick);
  }, 700);
}
function highlightNumber(num) {
  const cells = document.querySelectorAll("#bingoCard div");
  cells.forEach((c) => {
    if (c.innerText == String(num)) c.classList.add("active");
  });
}

// Buy ticket integration
async function buyTicket(method) {
  try {
    if (method === "stripe") {
      const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 5000, currency: "usd" }), // 5000 = $50
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Stripe failed: " + JSON.stringify(data));
      }
    } else if (method === "razorpay") {
      const res = await fetch(`${BACKEND_URL}/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50000, currency: "INR" }), // ₹500
      });
      const order = await res.json();
      alert("Razorpay order created (demo): " + order.id);
      // Here you would open Razorpay checkout widget
    } else if (method === "paypal") {
      const res = await fetch(`${BACKEND_URL}/create-paypal-order`, {
        method: "POST",
      });
      const data = await res.json();
      alert("PayPal demo: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}

// Expose to global
window.startDemoRound = startDemoRound;
window.buyTicket = buyTicket;

