from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, Message, Product, CartItem, Order, OrderItem
import os

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Setup database and seed data if needed ---
with app.app_context():
    db.create_all()
    if Product.query.count() == 0:
        p1 = Product(name='3 KG Plastic Container', description='Suitable for storage of biscuits.', price=100.0, category='containers')
        p2 = Product(name='5 KG Plastic Container', description='Ideal for medium-scale storage.', price=300.0, category='containers')
        p3 = Product(name='6 KG Plastic Container', description='Best suited for bulk storage.', price=500.0, category='containers')
        db.session.add_all([p1, p2, p3])
        db.session.commit()

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        # Simple JSON handling for signup or Form handling
        data = request.json if request.is_json else request.form
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
            
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('index')})
        return redirect(url_for('index'))
        
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        data = request.json if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            if request.is_json:
                return jsonify({'success': True, 'redirect': url_for('index')})
            return redirect(url_for('index'))
            
        return jsonify({'error': 'Invalid credentials'}), 401
        
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/me')
def api_me():
    if current_user.is_authenticated:
        return jsonify({'logged_in': True, 'user': {'name': current_user.username, 'email': current_user.email}})
    return jsonify({'logged_in': False})

@app.route('/products')
def products():
    products_list = Product.query.all()
    return render_template('products.html', products=products_list)

@app.route('/gallery')
def gallery():
    return render_template('gallery.html')

@app.route('/virtual-tour')
def virtual_tour():
    return render_template('virtual-tour.html')

@app.route('/reviews')
def reviews():
    return render_template('reviews.html')

@app.route('/cart')
@login_required
def cart():
    items = CartItem.query.filter_by(user_id=current_user.id).all()
    subtotal = sum(item.product.price * item.quantity for item in items if item.product)
    tax = round(subtotal * 0.05)
    total = subtotal + tax
    return render_template('cart.html', items=items, subtotal=subtotal, tax=tax, total=total)

@app.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if item:
        item.quantity += quantity
    else:
        new_item = CartItem(user_id=current_user.id, product_id=product_id, quantity=quantity)
        db.session.add(new_item)
        
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/cart/remove', methods=['POST'])
@login_required
def remove_from_cart():
    cart_item_id = request.form.get('cart_item_id')
    if cart_item_id:
        item = CartItem.query.filter_by(id=cart_item_id, user_id=current_user.id).first()
        if item:
            db.session.delete(item)
            db.session.commit()
    return redirect(url_for('cart'))

@app.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    subtotal = sum(item.product.price * item.quantity for item in cart_items if item.product)
    tax = round(subtotal * 0.05)
    total = subtotal + tax
    if request.method == 'POST':
        # Implement mock checkout flow
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400
            
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        order = Order(user_id=current_user.id, total_amount=total, status='Completed')
        db.session.add(order)
        db.session.flush() # Get order ID
        
        for item in cart_items:
            order_item = OrderItem(order_id=order.id, product_id=item.product_id, 
                                   quantity=item.quantity, price_at_purchase=item.product.price)
            db.session.add(order_item)
            db.session.delete(item)
            
        db.session.commit()
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('success')})
        return redirect(url_for('success'))
        
    return render_template('checkout.html', cart_items=cart_items, subtotal=subtotal, tax=tax, total=total)

@app.route('/success')
def success():
    return render_template('success.html')

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json if request.is_json else request.form
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject', '')
    message_content = data.get('message')
    
    if not all([name, email, message_content]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    new_message = Message(name=name, email=email, subject=subject, message_content=message_content)
    db.session.add(new_message)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Message sent successfully'})

if __name__ == '__main__':
    app.run(debug=True)
