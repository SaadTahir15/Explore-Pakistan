// cart.js

// Function to update the cart item count on the cart icon
async function updateCartItemCount() {
    try {
        const response = await fetch("/cart-item-count");
        const data = await response.json();
        const cartItemCount = data.count || 0;
        const cartItemCountElement = document.getElementById('cartItemCount');
        if (cartItemCountElement) {
            cartItemCountElement.textContent = cartItemCount;
        }
    } catch (error) {
        console.error("Error updating cart item count:", error);
    }
}

// Call the function to update the cart item count on page load
updateCartItemCount();
