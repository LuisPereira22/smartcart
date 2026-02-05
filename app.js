/* Smart Cart Logic */

// State
const state = {
    cart: [],
    view: 'home',
    theme: 'light'
};

// DOM Elements
const views = {
    home: document.getElementById('home-view'),
    dashboard: document.getElementById('dashboard-view'),
    scanner: document.getElementById('scanner-view'),
    fresh: document.getElementById('fresh-view'),
    cart: document.getElementById('cart-view')
};

const header = document.getElementById('main-header');
const pageTitle = document.getElementById('page-title');
const backBtn = document.getElementById('back-btn');


let html5QrcodeScanner = null;

// Init
function init() {
    setupEventListeners();
    renderFreshCategories();

    // Check for camera permissions early (optional)
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            console.log("Cameras found:", devices);
        }
    }).catch(err => console.log("Camera error", err));
}

function setupEventListeners() {
    // Navigation
    document.getElementById('start-btn').addEventListener('click', () => navigateTo('dashboard'));
    backBtn.addEventListener('click', handleBack);

    // Dashboard Menu
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            if (action === 'scan') {
                navigateTo('scanner');
                startScanner();
            }
            if (action === 'fresh') navigateTo('fresh');
            if (action === 'cart') {
                renderCart();
                navigateTo('cart');
            }
        });
    });

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Scanner Controls
    document.getElementById('stop-scan-btn').addEventListener('click', stopScanner);
}

// Scanner Logic
function startScanner() {
    const container = document.getElementById('scanner-container');
    container.innerHTML = ''; // Clear previous
    document.getElementById('scan-result').classList.add('hidden');

    html5QrcodeScanner = new Html5Qrcode("scanner-container");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
            // Parsing error, ignore 
        }
    ).catch(err => {
        console.error(err);
        container.innerHTML = `<p style="color:white; text-align:center; padding-top:100px;">Camera access failed.<br>Ensure you are using HTTPS or Localhost.</p>`;
    });
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log("Scanner stopped");
        }).catch(err => console.error("Failed to stop scanner", err));
    }
    navigateTo('dashboard');
}

function onScanSuccess(decodedText, decodedResult) {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log("Scanned:", decodedText);
            fetchProductData(decodedText);
        });
    }
}

async function fetchProductData(barcode) {
    const resultContainer = document.getElementById('scan-result');
    resultContainer.innerHTML = '<p style="text-align:center;">Fetching data...</p>';
    resultContainer.classList.remove('hidden');

    // 1. Check Mock Data (Demo Mode)
    if (MOCK_DB.fast_food_codes[barcode]) {
        renderProductResult(MOCK_DB.fast_food_codes[barcode], barcode, true);
        return;
    }

    // 2. Fetch from OpenFoodFacts
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            renderProductResult(data.product, barcode, false);
        } else {
            renderNotFound(barcode);
        }
    } catch (err) {
        console.error(err);
        resultContainer.innerHTML = '<p style="text-align:center; color:red;">Network Error.</p>';
    }
}

function renderProductResult(product, barcode, isMock) {
    const container = document.getElementById('scan-result');

    // Extract Data
    const name = isMock ? product.name : product.product_name || "Unknown Product";
    const image = isMock ? product.image_url : product.image_front_small_url || "https://via.placeholder.com/150";
    const brands = isMock ? "" : (product.brands || "");

    // Check if food (simple heuristic: has nutrition info)
    const nutriments = product.nutriments || {};
    const calories = nutriments['energy-kcal_100g'] || 0;
    const protein = nutriments['proteins_100g'] || 0;
    const sugar = nutriments['sugars_100g'] || 0;

    const isFood = (calories > 0 || protein > 0) || isMock;

    let content = `
        <div style="text-align:center;">
             <img src="${image}" style="height:100px; border-radius:8px; margin-bottom:10px;">
             <h3>${name}</h3>
             <small>${brands}</small>
        </div>
    `;

    if (isFood) {
        content += `
            <div class="nutrition-info">
                <div class="nutri-item"><span>Cal/100g</span> <strong>${calories}</strong></div>
                <div class="nutri-item"><span>Protein</span> <strong>${protein}g</strong></div>
                <div class="nutri-item"><span>Sugar</span> <strong>${sugar}g</strong></div>
            </div>
            
            ${getWarnings(nutriments)}
            
            <button class="btn btn-large" onclick="addScannedToCart('${barcode}', '${name.replace(/'/g, "\\'")}', ${calories}, ${protein}, ${sugar}, '${image}')">
                Add to Cart
            </button>
        `;
    } else {
        content += `
            <div style="margin: 20px 0; padding:10px; background:#eee; border-radius:8px;">
                <i class="fas fa-box-open"></i> Non-food Item
                <p>Nutritional data not applicable.</p>
            </div>
             <button class="btn btn-large" onclick="addScannedToCart('${barcode}', '${name.replace(/'/g, "\\'")}', 0, 0, 0, '${image}')">
                Add to Cart
            </button>
        `;
    }

    // Rescan button
    content += `
        <button class="btn btn-secondary" style="width:100%; margin-top:10px;" onclick="startScanner()">
            Scan Another
        </button>
    `;

    container.innerHTML = content;
}

function getWarnings(nutriments) {
    const warnings = [];
    if ((nutriments['sugars_100g'] || 0) > 20) warnings.push('<span style="color:#e74c3c; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> High Sugar</span>');
    if ((nutriments['salt_100g'] || 0) > 1.5) warnings.push('<span style="color:#e67e22; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> High Salt</span>');

    if (warnings.length === 0) return '';
    return `<div style="margin:10px 0; text-align:center;">${warnings.join(' &nbsp; ')}</div>`;
}

function renderNotFound(barcode) {
    const container = document.getElementById('scan-result');
    container.innerHTML = `
        <h3>Product Not Found</h3>
        <p>Barcode: ${barcode}</p>
        <button class="btn btn-secondary" onclick="startScanner()">Scan Again</button>
    `;
}

// Add scanned item to cart
window.addScannedToCart = function (id, name, kCal, protein, sugar, img) {
    const cartItem = {
        name: name,
        kCal: kCal,
        protein: protein,
        sugar: sugar,
        qty: 1, // Default 1 for scanned
        unit: 'item',
        totalCal: kCal
    };

    state.cart.push(cartItem);
    alert("Item added to cart!");
    navigateTo('dashboard'); // Or back to scan
};


// Navigation Logic
function navigateTo(viewName) {
    // Hide all views
    Object.values(views).forEach(el => el.classList.add('hidden'));

    // Show target view
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
        state.view = viewName;
    }

    // Update Header
    updateHeader(viewName);
}

function updateHeader(viewName) {
    if (viewName === 'home') {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        // Set Title
        const titles = {
            dashboard: 'Dashboard',
            scanner: 'Scan Item',
            fresh: 'Fresh Market',
            cart: 'Your Cart'
        };
        pageTitle.textContent = titles[viewName] || 'Smart Cart';

        // Back Button Logic
        if (viewName === 'dashboard') {
            backBtn.style.visibility = 'hidden';
        } else {
            backBtn.style.visibility = 'visible';
        }
    }
}

function handleBack() {
    if (state.view === 'dashboard') return;
    // Default back to dashboard for now
    navigateTo('dashboard');
}

// Data Rendering
function renderFreshCategories() {
    const container = document.getElementById('fresh-categories');
    if (!container) return;

    container.innerHTML = MOCK_DB.fresh_categories.map(cat => `
        <div class="product-card" onclick="showCategory('${cat.id}')">
            <i class="fas ${cat.icon} fa-2x" style="color: var(--primary-color); margin-bottom: 10px;"></i>
            <h3>${cat.name}</h3>
        </div>
    `).join('');
}


// Fresh Products Logic
function showCategory(catId) {
    const products = MOCK_DB.fresh_products[catId];
    const container = document.getElementById('fresh-products');
    const catContainer = document.getElementById('fresh-categories');

    if (!products) {
        alert("Category empty or not found");
        return;
    }

    // Hide Categories, Show Products
    catContainer.classList.add('hidden');
    container.classList.remove('hidden');

    // Add "Back to Categories" button helper
    container.innerHTML = `
        <button class="btn btn-secondary" style="margin-bottom: 1rem;" onclick="resetFreshView()">
            <i class="fas fa-arrow-left"></i> Back to Categories
        </button>
        <div class="category-grid">
            ${products.map(prod => `
            <div class="product-card" onclick="showProductDetails('${catId}', '${prod.id}')">
                <div class="product-icon"><i class="fas fa-leaf"></i></div>
                <h3>${prod.name}</h3>
                <p>${prod.kCal} kCal / ${prod.unit}</p>
            </div>
            `).join('')}
        </div>
    `;
}

function resetFreshView() {
    document.getElementById('fresh-products').classList.add('hidden');
    document.getElementById('fresh-categories').classList.remove('hidden');
}

function showProductDetails(catId, prodId) {
    const product = MOCK_DB.fresh_products[catId].find(p => p.id === prodId);
    if (!product) return;

    // Create a modal for details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <h2>${product.name}</h2>
            <div class="nutrition-info">
                <div class="nutri-item"><span>Calories</span> <strong>${product.kCal}</strong></div>
                <div class="nutri-item"><span>Protein</span> <strong>${product.protein}g</strong></div>
                <div class="nutri-item"><span>Sugar</span> <strong>${product.sugar}g</strong></div>
            </div>

            <div class="quantity-control">
                <button onclick="adjustQty(-1)">-</button>
                <span id="qty-display">1</span>
                <button onclick="adjustQty(1)">+</button>
            </div>

            <button class="btn btn-large" onclick="addToCart('${catId}', '${prodId}', parseInt(document.getElementById('qty-display').innerText))">
                Add to Cart
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.adjustQty = function (delta) {
    const display = document.getElementById('qty-display');
    let current = parseInt(display.innerText);
    current += delta;
    if (current < 1) current = 1;
    display.innerText = current;
};

window.addToCart = function (catId, prodId, qty) {
    const product = MOCK_DB.fresh_products[catId].find(p => p.id === prodId);

    // Construct cart item
    const cartItem = {
        name: product.name,
        kCal: product.kCal,
        protein: product.protein,
        sugar: product.sugar,
        qty: qty,
        unit: product.unit,
        totalCal: product.kCal * qty
    };

    state.cart.push(cartItem);

    // Feedback
    const btn = document.querySelector('.modal-content .btn-large');
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.backgroundColor = 'var(--primary-dark)';

    setTimeout(() => {
        document.querySelector('.modal-overlay').remove();
        // Optional: Go to cart or stay? Let's stay for now.
    }, 800);
}

// Global scope for onclick handlers
window.showCategory = showCategory;
window.resetFreshView = resetFreshView;
window.showProductDetails = showProductDetails;


// Cart Rendering
function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    const totalCalsEl = document.getElementById('total-cals');
    const totalProteinEl = document.getElementById('total-protein');
    const warningsContainer = document.querySelector('.cart-summary .warnings'); // We need to add this container first if not present

    if (state.cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Your cart is empty.</p>';
        totalCalsEl.innerText = '0';
        totalProteinEl.innerText = '0';
        if (warningsContainer) warningsContainer.innerHTML = '';
        return;
    }

    let totalCals = 0;
    let totalProtein = 0;
    let totalSugar = 0;
    let allAllergens = new Set();

    state.cart.forEach((item, index) => {
        totalCals += item.totalCal;
        totalProtein += item.qty * item.protein;
        totalSugar += item.qty * item.sugar;

        // Mock allergen logic (in a real app, we'd store allergens in the item)
        // For now, let's assume if it has nuts/gluten it's in the name or we stored it. 
        // We'll skip complex allergen extracting for now as we didn't store it in cartItem.
        // Let's add a visual indicator if sugar is high for this item.

        const isHighSugar = (item.sugar > 20);

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h4>${item.name} ${isHighSugar ? '<i class="fas fa-exclamation-triangle" style="color:#e74c3c; font-size:0.8rem;" title="High Sugar"></i>' : ''}</h4>
                <small>${item.qty} x ${item.unit} (${item.totalCal.toFixed(0)} kcal)</small>
            </div>
            <button class="btn-icon delete-btn" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });

    totalCalsEl.innerText = totalCals.toFixed(0);
    totalProteinEl.innerText = totalProtein.toFixed(1);

    // Update Summary Warnings
    // Create container if it doesn't exist in the HTML structure yet (it doesn't in index.html)
    // We will inject it here dynamically or validly check if we updated index.html. 
    // Let's rely on just appending to summary for now.

    let summaryHTML = `
        <h3>Total</h3>
        <p>Calories: <span id="total-cals">${totalCals.toFixed(0)}</span></p>
        <p>Protein: <span id="total-protein">${totalProtein.toFixed(1)}</span>g</p>
        <p>Sugar: <span>${totalSugar.toFixed(1)}</span>g</p>
    `;

    if (totalSugar > 50) {
        summaryHTML += `<div style="margin-top:10px; color:#e74c3c; font-weight:bold; font-size:0.9rem;">
            <i class="fas fa-exclamation-circle"></i> High Total Sugar
        </div>`;
    }

    summaryHTML += `<button id="checkout-btn" class="btn btn-large" onclick="alert('Checkout Simulation Complete!')">Finish Shopping</button>`;

    document.querySelector('.cart-summary').innerHTML = summaryHTML;
}

// Scanner Logic
function startScanner() {
    const container = document.getElementById('scanner-container');
    container.innerHTML = ''; // Clear previous
    document.getElementById('scan-result').classList.add('hidden');

    // Add Simulation Button for Demo
    const simBtn = document.createElement('button');
    simBtn.className = 'btn btn-secondary';
    simBtn.style.marginBottom = '10px';
    simBtn.style.fontSize = '0.8rem';
    simBtn.innerText = "Simulate Scan (Demo Code)";
    simBtn.onclick = () => {
        stopScanner();
        fetchProductData("123456789");
    };
    container.parentNode.insertBefore(simBtn, container);

    html5QrcodeScanner = new Html5Qrcode("scanner-container");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
            // Parsing error, ignore 
        }
    ).catch(err => {
        console.error(err);
        container.innerHTML = `<p style="color:white; text-align:center; padding-top:100px;">Camera access failed.<br>Ensure you are using HTTPS or Localhost.</p>`;
    });
}

window.removeFromCart = function (index) {
    state.cart.splice(index, 1);
    renderCart();
};

function toggleTheme() {
    const body = document.body;
    if (state.theme === 'light') {
        body.setAttribute('data-theme', 'dark');
        state.theme = 'dark';
        document.querySelector('#theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    } else {
        body.removeAttribute('data-theme');
        state.theme = 'light';
        document.querySelector('#theme-toggle i').classList.replace('fa-sun', 'fa-moon');
    }
}

// Start App
document.addEventListener('DOMContentLoaded', init);
