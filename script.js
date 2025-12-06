// --- DONNÉES DU MENU ---
// Les images sont associées selon l'ordre fourni (1 à 18).
const menuData = {
    plats: [
        { name: "Haricots aux Pieds de Porc", desc: "Madesu avec viande fumée, mijoté lentement.", price: 18, img: "asset/16.webp" },
        { name: "Liboké de Poisson", desc: "Poisson fumé ou frais cuit à l'étuvée dans des feuilles de bananier.", price: 22, img: "asset/11.webp" },
        { name: "Vers de Palme Grillés", desc: "Minkala / Mbinzo, croustillants et riches en protéines.", price: 15, img: "asset/8.webp" },
        { name: "Poulet à la Chikwangue", desc: "Accompagné de boules de Chikwangue ou pâte de Manioc.", price: 20, img: "asset/9.webp" },
        { name: "Ragoût Légumes Verts", desc: "Mélange savoureux avec champignons frais.", price: 16, img: "asset/14.webp" },
        { name: "Poisson Fumé Émietté", desc: "Servi avec une étuvée de poisson parfumée.", price: 19, img: "asset/2.webp" },
        { name: "Madesu na Mboka", desc: "Soupe ou ragoût de viande traditionnelle.", price: 18, img: "asset/13.webp" },
        { name: "Légumes-Feuilles & Poisson", desc: "Épinards ou Folon avec poisson fumé.", price: 17, img: "asset/17.webp" },
        { name: "Mbinzo Sautés", desc: "Vers et légumes sautés à la poêle.", price: 16, img: "asset/15.webp" },
        { name: "Poisson Grillé & Pondu", desc: "Servi avec Chikwangue.", price: 24, img: "asset/12.webp" },
        { name: "Chinchinga", desc: "Brochettes de tripes braisées, épicées.", price: 14, img: "asset/5.webp" },
        { name: "Poisson Sauce Arachide", desc: "Grillé avec Pondu à la pâte d'arachide.", price: 23, img: "asset/4.webp" },
        { name: "Malewa", desc: "Pâte de bambou ou Tofou Africain.", price: 15, img: "asset/7.webp" },
        { name: "Silure Fumé en Sauce", desc: "Poisson-chat mijoté.", price: 21, img: "asset/10.webp" },
        { name: "Silure Tomate & Plantain", desc: "Poisson-chat en sauce tomate avec plantain bouilli.", price: 22, img: "asset/6.webp" },
        { name: "Folon aux Oignons", desc: "Ragoût de légumes (Amarante).", price: 14, img: "asset/1.webp" },
        { name: "Poulet Moambe", desc: "La spécialité ! Accompagnement de manioc.", price: 25, img: "asset/18.webp" },
        { name: "Ragoût Viande & Tripes", desc: "Parfumé aux herbes (Dill).", price: 19, img: "asset/3.webp" }
    ],
    boissons: [
        { name: "Primus", desc: "Bière Locale", price: 5, img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=150&q=80" },
        { name: "Tembo", desc: "Bière Brune", price: 6, img: "https://images.unsplash.com/photo-1535958636474-b021ee8876a3?auto=format&fit=crop&w=150&q=80" },
        { name: "Skol", desc: "Bière Légère", price: 5, img: "https://images.unsplash.com/photo-1586993451228-097180589669?auto=format&fit=crop&w=150&q=80" },
        { name: "Castel", desc: "Bière Premium", price: 6, img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=150&q=80" },
        { name: "Vin de Palme", desc: "Malafu / Nsamba - Traditionnel", price: 8, img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=150&q=80" },
        { name: "Whisky de Canne", desc: "Lotoko / Kasiksi - Liqueur forte", price: 10, img: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=150&q=80" },
        { name: "Jus de Bissap", desc: "Fleur d'hibiscus, frais et sucré", price: 4, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=150&q=80" },
        { name: "Tangawisi", desc: "Jus de Gingembre piquant", price: 4, img: "https://images.unsplash.com/photo-1598282362354-949cb37e69be?auto=format&fit=crop&w=150&q=80" }
    ]
};

// --- RENDER FUNCTIONS ---

function renderMenu() {
    // Render Plats
    const platsContainer = document.getElementById('plats-container');
    let platsHTML = '';
    menuData.plats.forEach(item => {
        platsHTML += `
            <div class="d1-item type-plat" onclick="addToCart('${item.name}', ${item.price})">
                <img src="${item.img}" alt="${item.name}" class="d1-thumb">
                <div class="d1-info">
                    <div class="d1-item-name">${item.name}</div>
                    <span class="d1-item-desc">${item.desc}</span>
                </div>
                <div class="d1-price">${item.price}€</div>
                <button class="add-btn-mini"><i class="fas fa-plus"></i></button>
            </div>
        `;
    });
    platsContainer.innerHTML = platsHTML;

    // Render Boissons
    const boissonsContainer = document.getElementById('boissons-container');
    let boissonsHTML = '';
    menuData.boissons.forEach(item => {
        boissonsHTML += `
            <div class="d1-item type-boisson" onclick="addToCart('${item.name}', ${item.price})">
                <img src="${item.img}" alt="${item.name}" class="d1-thumb">
                <div class="d1-info">
                    <div class="d1-item-name">${item.name}</div>
                    <span class="d1-item-desc">${item.desc}</span>
                </div>
                <div class="d1-price">${item.price}€</div>
                <button class="add-btn-mini"><i class="fas fa-plus"></i></button>
            </div>
        `;
    });
    boissonsContainer.innerHTML = boissonsHTML;
}

// --- LOGIC CART & UI ---
let cart = [];

function addToCart(name, price) {
    cart.push({name, price});
    updateCartUI();
    showToast();
}

function updateCartUI() {
    const countBadge = document.getElementById('cartCount');
    countBadge.innerText = cart.length;
    countBadge.classList.add('visible', 'pop-anim');
    setTimeout(() => countBadge.classList.remove('pop-anim'), 300);

    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    
    if(cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#555; margin-top:50px;">Votre panier est vide.</p>';
        cartTotalEl.innerText = '0 €';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        html += `
            <div class="cart-item">
                <span>${item.name}</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${item.price} €</span>
                    <i class="fas fa-trash" style="color:#555; cursor:pointer; font-size:0.8rem;" onclick="removeFromCart(${index})"></i>
                </div>
            </div>
        `;
    });
    cartItemsContainer.innerHTML = html;
    cartTotalEl.innerText = total + ' €';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function openCart() {
    document.getElementById('cartModal').classList.add('open');
}

function closeCart() {
    document.getElementById('cartModal').classList.remove('open');
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function checkout() {
    if(cart.length === 0) {
        alert('Votre panier est vide !');
        return;
    }
    
    const loader = document.getElementById('loader');
    loader.classList.add('active');
    
    setTimeout(() => {
        alert('Commande envoyée en cuisine ! 🍽️\nMerci pour votre confiance.');
        cart = [];
        updateCartUI();
        closeCart();
        loader.classList.remove('active');
    }, 2000);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    renderMenu();
    
    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = function() {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
});