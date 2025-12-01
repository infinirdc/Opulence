// Gestion du panier Opulence

class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.initEventListeners();
        this.updateCartDisplay();
    }

    // Charger le panier depuis le localStorage
    loadCart() {
        const cartData = localStorage.getItem('opulence_cart');
        return cartData ? JSON.parse(cartData) : [];
    }

    // Sauvegarder le panier dans le localStorage
    saveCart() {
        localStorage.setItem('opulence_cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
    }

    // Ajouter un article au panier
    addItem(platId, nom, prix, quantite = 1) {
        const existingItem = this.cart.find(item => item.platId === platId);
        
        if (existingItem) {
            existingItem.quantite += quantite;
        } else {
            this.cart.push({
                platId,
                nom,
                prix,
                quantite,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart();
        this.showNotification(`${quantite}x ${nom} ajouté au panier`, 'success');
    }

    // Mettre à jour la quantité d'un article
    updateQuantity(platId, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(platId);
            return;
        }

        const item = this.cart.find(item => item.platId === platId);
        if (item) {
            item.quantite = newQuantity;
            this.saveCart();
        }
    }

    // Supprimer un article du panier
    removeItem(platId) {
        const itemIndex = this.cart.findIndex(item => item.platId === platId);
        if (itemIndex !== -1) {
            const removedItem = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.showNotification(`${removedItem.nom} retiré du panier`, 'info');
        }
    }

    // Vider le panier
    clearCart() {
        if (this.cart.length > 0) {
            this.cart = [];
            this.saveCart();
            this.showNotification('Panier vidé', 'info');
        }
    }

    // Calculer le total du panier
    calculateTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.prix * item.quantite);
        }, 0);
    }

    // Mettre à jour l'affichage du panier
    updateCartDisplay() {
        // Mettre à jour le compteur
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantite, 0);
        document.getElementById('cartCount').textContent = cartCount;
        
        // Mettre à jour la sidebar du panier
        this.updateCartSidebar();
    }

    // Mettre à jour la sidebar du panier
    updateCartSidebar() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalElement = document.getElementById('cartTotal');
        const orderBtn = document.getElementById('orderBtn');
        
        if (!cartItemsContainer) return;
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Votre panier est vide</p>
                    <small>Ajoutez des plats pour commencer</small>
                </div>
            `;
            cartTotalElement.textContent = '0.00 €';
            orderBtn.disabled = true;
            orderBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Panier vide';
            return;
        }
        
        // Activer le bouton de commande
        orderBtn.disabled = false;
        orderBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Commander';
        
        // Générer le HTML des articles
        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.platId}">
                <div class="cart-item-info">
                    <h4>${item.nom}</h4>
                    <div class="cart-item-price">${item.prix.toFixed(2)} €</div>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn minus" onclick="cartManager.updateItemQty('${item.platId}', -1)">-</button>
                    <span class="cart-item-qty">${item.quantite}</span>
                    <button class="qty-btn plus" onclick="cartManager.updateItemQty('${item.platId}', 1)">+</button>
                    <button class="btn-icon" onclick="cartManager.removeItem('${item.platId}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Mettre à jour le total
        cartTotalElement.textContent = this.calculateTotal().toFixed(2) + ' €';
    }

    // Mettre à jour la quantité d'un article (méthode publique)
    updateItemQty(platId, change) {
        const item = this.cart.find(item => item.platId === platId);
        if (item) {
            const newQty = item.quantite + change;
            if (newQty > 0) {
                this.updateQuantity(platId, newQty);
            } else {
                this.removeItem(platId);
            }
        }
    }

    // Soumettre la commande
    async submitOrder() {
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        
        // Validation
        if (!customerName) {
            this.showNotification('Veuillez entrer votre nom', 'error');
            document.getElementById('customerName').focus();
            return;
        }
        
        if (!customerPhone) {
            this.showNotification('Veuillez entrer votre téléphone', 'error');
            document.getElementById('customerPhone').focus();
            return;
        }
        
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide', 'error');
            return;
        }
        
        // Préparer les données de la commande
        const orderData = {
            nomClient: customerName,
            telephone: customerPhone,
            plats: this.cart.map(item => ({
                platId: item.platId,
                quantite: item.quantite
            }))
        };
        
        // Désactiver le bouton pendant la soumission
        const orderBtn = document.getElementById('orderBtn');
        orderBtn.disabled = true;
        orderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        
        try {
            const response = await fetch('/commander', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Commande passée avec succès !', 'success');
                
                // Vider le panier
                this.clearCart();
                
                // Réinitialiser le formulaire
                document.getElementById('customerName').value = '';
                document.getElementById('customerPhone').value = '';
                
                // Fermer le panier
                this.toggleCart();
                
                // Afficher un message de confirmation
                setTimeout(() => {
                    this.showNotification(`Votre commande #${result.commandeId} est en préparation`, 'info');
                }, 1000);
                
            } else {
                this.showNotification(result.message || 'Erreur lors de la commande', 'error');
                orderBtn.disabled = false;
                orderBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Commander';
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur de connexion au serveur', 'error');
            orderBtn.disabled = false;
            orderBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Commander';
        }
    }

    // Basculer l'affichage du panier
    toggleCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Si on ouvre le panier, mettre à jour l'affichage
        if (sidebar.classList.contains('active')) {
            this.updateCartSidebar();
        }
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // Initialiser les écouteurs d'événements
    initEventListeners() {
        // Fermer le panier en cliquant sur l'overlay
        document.getElementById('cartOverlay')?.addEventListener('click', () => {
            this.toggleCart();
        });
        
        // Soumettre le formulaire de commande
        document.getElementById('orderBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
        
        // Vider le panier
        document.querySelector('.btn-clear')?.addEventListener('click', () => {
            if (this.cart.length > 0 && confirm('Vider le panier ?')) {
                this.clearCart();
            }
        });
        
        // Sauvegarder le panier avant de quitter la page
        window.addEventListener('beforeunload', () => {
            this.saveCart();
        });
        
        // Synchroniser le panier avec le serveur (session)
        this.syncWithServer();
    }

    // Synchroniser avec le serveur
    async syncWithServer() {
        try {
            const response = await fetch('/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.cart)
            });
            
            if (response.ok) {
                const serverCart = await response.json();
                // Fusionner les paniers si nécessaire
                if (serverCart && serverCart.length > 0) {
                    // Logique de fusion simple : priorité au panier local
                    // Vous pouvez implémenter une logique plus sophistiquée
                }
            }
        } catch (error) {
            // Silently fail - le panier local reste fonctionnel
            console.debug('Sync error:', error);
        }
    }
}

// Fonctions globales pour les boutons EJS
function addToCart(platId, nom, prix) {
    const qtyInput = document.getElementById(`qty-${platId}`);
    const quantity = parseInt(qtyInput.value) || 1;
    
    cartManager.addItem(platId, nom, prix, quantity);
    
    // Réinitialiser la quantité
    qtyInput.value = 1;
    
    // Ouvrir le panier
    cartManager.toggleCart();
}

function updateQuantity(platId, change) {
    const qtyInput = document.getElementById(`qty-${platId}`);
    let value = parseInt(qtyInput.value) + change;
    if (value < 1) value = 1;
    if (value > 10) value = 10;
    qtyInput.value = value;
}

function toggleCart() {
    cartManager.toggleCart();
}

function clearCart() {
    if (cartManager.cart.length > 0 && confirm('Vider le panier ?')) {
        cartManager.clearCart();
    }
}

function submitOrder() {
    cartManager.submitOrder();
}

// Initialiser le gestionnaire de panier
const cartManager = new CartManager();

// Exposer au scope global
window.cartManager = cartManager;

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Synchroniser avec le serveur au chargement
    cartManager.syncWithServer();
    
    // Vérifier s'il y a un message de succès dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('orderSuccess') === 'true') {
        cartManager.showNotification('Commande passée avec succès !', 'success');
    }
});